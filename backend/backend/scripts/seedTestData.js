const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Medication = require('../models/Medication');
const Regimen = require('../models/Regimen');
const DoseLog = require('../models/DoseLog');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/misogiao', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Test data arrays
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    dateOfBirth: new Date('1980-01-01'),
    phone: '123-456-7890',
    familyGroup: {
      name: 'Smith Family',
      role: 'admin'
    },
    medicationCategories: [
      { name: 'Morning Meds', color: '#4CAF50' },
      { name: 'Night Meds', color: '#2196F3' },
      { name: 'Emergency', color: '#F44336' }
    ]
  },
  {
    email: 'caregiver@test.com',
    password: 'password123',
    firstName: 'Care',
    lastName: 'Giver',
    dateOfBirth: new Date('1985-05-15'),
    phone: '234-567-8901',
    familyGroup: {
      name: 'Smith Family',
      role: 'caregiver'
    }
  },
  {
    email: 'patient@test.com',
    password: 'password123',
    firstName: 'Pat',
    lastName: 'Smith',
    dateOfBirth: new Date('1990-12-25'),
    phone: '345-678-9012',
    familyGroup: {
      name: 'Smith Family',
      role: 'patient'
    }
  }
];

const testMedications = [
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Heart & Blood Pressure',
    form: 'tablet',
    strength: {
      amount: 10,
      unit: 'mg'
    },
    sideEffects: ['Dry cough', 'Dizziness', 'Headache'],
    instructions: {
      withFood: 'optional',
      specialInstructions: 'Take in the morning'
    }
  },
  {
    name: 'Metformin',
    genericName: 'Metformin HCl',
    category: 'Diabetes',
    form: 'tablet',
    strength: {
      amount: 500,
      unit: 'mg'
    },
    sideEffects: ['Nausea', 'Diarrhea', 'Loss of appetite'],
    instructions: {
      withFood: 'required',
      specialInstructions: 'Take with meals'
    }
  },
  {
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    category: 'Vitamins & Supplements',
    form: 'capsule',
    strength: {
      amount: 2000,
      unit: 'IU'
    },
    sideEffects: [],
    instructions: {
      withFood: 'optional',
      specialInstructions: 'Can be taken any time of day'
    }
  }
];

// Function to generate dose logs for the past 30 days
const generateDoseLogs = async (user, regimen, startDate) => {
  const doseLogs = [];
  const now = new Date();
  let currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    // Get schedule times for the regimen
    const times = regimen.frequency === 'custom' 
      ? regimen.customSchedule.map(cs => cs.time)
      : regimen.scheduleTimes;

    for (const time of times) {
      const [hours, minutes] = time.split(':');
      const scheduledTime = new Date(currentDate);
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Skip future doses
      if (scheduledTime > now) continue;

      // Randomly determine if dose was taken, missed, or skipped
      const rand = Math.random();
      let status, actualTime, minutesLate;
      
      if (rand < 0.8) { // 80% taken
        status = 'taken';
        minutesLate = Math.floor(Math.random() * 60); // 0-60 minutes late
        actualTime = new Date(scheduledTime.getTime() + minutesLate * 60000);
      } else if (rand < 0.9) { // 10% missed
        status = 'missed';
        actualTime = null;
        minutesLate = 0;
      } else { // 10% skipped
        status = 'skipped';
        actualTime = null;
        minutesLate = 0;
      }

      const doseLog = new DoseLog({
        user: user._id,
        regimen: regimen._id,
        medication: regimen.medication,
        scheduledTime,
        actualTime,
        status,
        dosage: regimen.dosage,
        minutesLate,
        takenLate: minutesLate > 30,
        notes: status === 'skipped' ? 'Feeling unwell' : '',
        sideEffects: status === 'taken' ? [] : undefined,
        effectiveness: status === 'taken' ? {
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
        } : undefined,
        rewards: {
          points: status === 'taken' ? 10 : 0,
          bonusPoints: status === 'taken' && minutesLate === 0 ? 5 : 0
        }
      });

      doseLogs.push(doseLog);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return DoseLog.insertMany(doseLogs);
};

// Main seeding function
const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Medication.deleteMany({}),
      Regimen.deleteMany({}),
      DoseLog.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create users
    const users = await Promise.all(
      testUsers.map(async userData => {
        // Hash password before saving
        const salt = await bcrypt.genSalt(12);
        userData.password = await bcrypt.hash(userData.password, salt);
        return new User(userData).save();
      })
    );
    console.log('Created users');

    // Create medications
    const medications = await Medication.insertMany(testMedications);
    console.log('Created medications');

    // Create regimens
    const regimens = await Regimen.insertMany([
      {
        user: users[2]._id, // patient
        medication: medications[0]._id, // Lisinopril
        category: 'Morning Meds',
        patientInfo: {
          name: users[2].firstName + ' ' + users[2].lastName,
          relationship: 'self',
          isPatient: true
        },
        dosage: {
          amount: 1,
          unit: 'tablet'
        },
        frequency: 'once_daily',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        isActive: true
      },
      {
        user: users[2]._id, // patient
        medication: medications[1]._id, // Metformin
        category: 'Morning Meds',
        patientInfo: {
          name: users[2].firstName + ' ' + users[2].lastName,
          relationship: 'self',
          isPatient: true
        },
        dosage: {
          amount: 1,
          unit: 'tablet'
        },
        frequency: 'twice_daily',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        isActive: true
      },
      {
        user: users[2]._id, // patient
        medication: medications[2]._id, // Vitamin D3
        category: 'Morning Meds',
        patientInfo: {
          name: users[2].firstName + ' ' + users[2].lastName,
          relationship: 'self',
          isPatient: true
        },
        dosage: {
          amount: 1,
          unit: 'capsule'
        },
        frequency: 'weekly',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        isActive: true
      }
    ]);
    console.log('Created regimens');

    // Generate dose logs for each regimen
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    for (const regimen of regimens) {
      await generateDoseLogs(users[2], regimen, startDate);
    }
    console.log('Created dose logs');

    console.log('Successfully seeded test data!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedData();
