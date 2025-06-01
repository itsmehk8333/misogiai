const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Medication = require('../models/Medication');
const Regimen = require('../models/Regimen');
const DoseLog = require('../models/DoseLog');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to generate random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to generate adherence rate (realistic variations)
const getAdherenceRate = (baseRate = 0.85) => {
  // Add some realistic variation to adherence
  const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
  return Math.max(0.6, Math.min(0.98, baseRate + variation));
};

// Create sample medications
const createMedications = async () => {
  const medications = [
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      category: 'Heart & Blood Pressure',
      form: 'tablet',
      strength: { amount: 10, unit: 'mg' },
      color: 'Pink',
      shape: 'Round',
      manufacturer: 'Zestril',
      sideEffects: ['Dry cough', 'Dizziness', 'Headache'],
      instructions: { withFood: 'optional' },
      cost: { amount: 15.99, currency: 'USD', per: 'bottle' }
    },
    {
      name: 'Metformin',
      genericName: 'Metformin HCl',
      category: 'Diabetes',
      form: 'tablet',
      strength: { amount: 500, unit: 'mg' },
      color: 'White',
      shape: 'Oval',
      manufacturer: 'Glucophage',
      sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
      instructions: { withFood: 'required' },
      cost: { amount: 12.50, currency: 'USD', per: 'bottle' }
    },
    {
      name: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      category: 'Vitamins & Supplements',
      form: 'capsule',
      strength: { amount: 2000, unit: 'IU' },
      color: 'Yellow',
      shape: 'Capsule',
      manufacturer: 'Nature Made',
      sideEffects: [],
      instructions: { withFood: 'optional' },
      cost: { amount: 8.99, currency: 'USD', per: 'bottle' }
    },
    {
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      category: 'Digestive',
      form: 'capsule',
      strength: { amount: 20, unit: 'mg' },
      color: 'Purple',
      shape: 'Capsule',
      manufacturer: 'Prilosec',
      sideEffects: ['Headache', 'Stomach pain', 'Nausea'],
      instructions: { withFood: 'avoid' },
      cost: { amount: 18.75, currency: 'USD', per: 'bottle' }
    },
    {
      name: 'Sertraline',
      genericName: 'Sertraline HCl',
      category: 'Mental Health',
      form: 'tablet',
      strength: { amount: 50, unit: 'mg' },
      color: 'Light Blue',
      shape: 'Oval',
      manufacturer: 'Zoloft',
      sideEffects: ['Nausea', 'Dry mouth', 'Drowsiness', 'Insomnia'],
      instructions: { withFood: 'optional' },
      cost: { amount: 25.99, currency: 'USD', per: 'bottle' }
    },
    {
      name: 'Multivitamin',
      genericName: 'Multivitamin Complex',
      category: 'Vitamins & Supplements',
      form: 'tablet',
      strength: { amount: 1, unit: 'tablet' },
      color: 'Multi-colored',
      shape: 'Oval',
      manufacturer: 'Centrum',
      sideEffects: [],
      instructions: { withFood: 'required' },
      cost: { amount: 12.99, currency: 'USD', per: 'bottle' }
    }
  ];

  const createdMedications = [];
  for (const medData of medications) {
    try {
      const existingMed = await Medication.findOne({ name: medData.name });
      if (!existingMed) {
        const medication = new Medication(medData);
        await medication.save();
        createdMedications.push(medication);
        console.log(`Created medication: ${medication.name}`);
      } else {
        createdMedications.push(existingMed);
        console.log(`Medication already exists: ${existingMed.name}`);
      }
    } catch (error) {
      console.error(`Error creating medication ${medData.name}:`, error);
    }
  }

  return createdMedications;
};

// Create user with comprehensive data
const createUserWithData = async () => {
  try {
    // Create or find user
    const userData = {
      email: 'john.doe.medtracker@example.com',
      username: 'john.doe.medtracker',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-03-15'),
      phone: '+1-555-0123',
      familyGroup: {
        name: 'Doe Family',
        role: 'patient'
      },
      medicationCategories: [
        { name: 'Morning Meds', color: '#3B82F6', description: 'Medications taken in the morning' },
        { name: 'Evening Meds', color: '#10B981', description: 'Medications taken in the evening' },
        { name: 'As Needed', color: '#F59E0B', description: 'PRN medications' }
      ],
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1-555-0124',
        relationship: 'Spouse'
      },
      preferences: {
        notifications: {
          email: true,
          push: true,
          reminderMinutes: 15
        },
        theme: 'light',
        timezone: 'America/New_York',
        lateLoggingWindow: 240,
        autoMarkMissed: true,
        calendarIntegration: {
          enabled: false
        }
      },
      adherenceStats: {
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        streakDays: 0
      },
      rewards: {
        points: 0,
        level: 1,
        badges: [],
        achievements: []
      }
    };

    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = new User(userData);
      await user.save();
      console.log('Created user:', user.email);
    } else {
      console.log('User already exists:', user.email);
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Create regimens for the user
const createRegimens = async (user, medications) => {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  const regimensData = [
    {
      medication: medications.find(m => m.name === 'Lisinopril')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'tablet' },
      frequency: 'once_daily',
      startDate: new Date(twoYearsAgo.getFullYear(), 0, 15), // Started 2 years ago in January
      purpose: 'High blood pressure management',
      prescribedBy: {
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        contactInfo: 'cardiology@hospital.com'
      },
      adherenceGoal: { percentage: 90 },
      refillReminder: { enabled: true, daysBeforeEmpty: 7, currentStock: 25 }
    },
    {
      medication: medications.find(m => m.name === 'Metformin')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'tablet' },
      frequency: 'twice_daily',
      startDate: new Date(twoYearsAgo.getFullYear(), 2, 10), // Started in March 2 years ago
      purpose: 'Type 2 diabetes management',
      prescribedBy: {
        name: 'Dr. Michael Chen',
        specialty: 'Endocrinology',
        contactInfo: 'endocrine@hospital.com'
      },
      adherenceGoal: { percentage: 95 },
      refillReminder: { enabled: true, daysBeforeEmpty: 5, currentStock: 40 }
    },
    {
      medication: medications.find(m => m.name === 'Vitamin D3')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'capsule' },
      frequency: 'once_daily',
      startDate: new Date(twoYearsAgo.getFullYear(), 5, 1), // Started in June 2 years ago
      purpose: 'Vitamin D deficiency',
      prescribedBy: {
        name: 'Dr. Sarah Johnson',
        specialty: 'Primary Care',
        contactInfo: 'primarycare@clinic.com'
      },
      adherenceGoal: { percentage: 80 },
      refillReminder: { enabled: true, daysBeforeEmpty: 10, currentStock: 30 }
    },
    {
      medication: medications.find(m => m.name === 'Omeprazole')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'capsule' },
      frequency: 'once_daily',
      startDate: new Date(twoYearsAgo.getFullYear() + 1, 3, 20), // Started 1 year ago in April
      endDate: new Date(twoYearsAgo.getFullYear() + 1, 9, 20), // Ended 6 months later
      isActive: false,
      purpose: 'GERD treatment',
      prescribedBy: {
        name: 'Dr. Lisa Rodriguez',
        specialty: 'Gastroenterology',
        contactInfo: 'gi@hospital.com'
      },
      adherenceGoal: { percentage: 85 }
    },
    {
      medication: medications.find(m => m.name === 'Sertraline')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'tablet' },
      frequency: 'once_daily',
      startDate: new Date(twoYearsAgo.getFullYear() + 1, 7, 1), // Started 5 months ago
      purpose: 'Depression and anxiety management',
      prescribedBy: {
        name: 'Dr. Robert Kim',
        specialty: 'Psychiatry',
        contactInfo: 'psychiatry@mentalhealth.com'
      },
      adherenceGoal: { percentage: 95 },
      refillReminder: { enabled: true, daysBeforeEmpty: 7, currentStock: 20 }
    },
    {
      medication: medications.find(m => m.name === 'Multivitamin')._id,
      category: 'Morning Meds',
      dosage: { amount: 1, unit: 'tablet' },
      frequency: 'once_daily',
      startDate: new Date(twoYearsAgo.getFullYear(), 0, 1), // Started 2 years ago
      purpose: 'General health maintenance',
      adherenceGoal: { percentage: 75 },
      refillReminder: { enabled: true, daysBeforeEmpty: 14, currentStock: 50 }
    }
  ];

  const createdRegimens = [];
  for (const regimenData of regimensData) {
    try {
      regimenData.user = user._id;
      const regimen = new Regimen(regimenData);
      await regimen.save();
      createdRegimens.push(regimen);
      console.log(`Created regimen for: ${medications.find(m => m._id.equals(regimenData.medication)).name}`);
    } catch (error) {
      console.error('Error creating regimen:', error);
    }
  }

  return createdRegimens;
};

// Generate dose logs for the past 2 years
const generateDoseLogs = async (user, regimens) => {
  console.log('Starting dose log generation...');
  
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  let totalDoses = 0;
  let takenDoses = 0;
  let missedDoses = 0;
  
  for (const regimen of regimens) {
    console.log(`Generating dose logs for: ${regimen.medication.name || 'Unknown'}`);
    
    const startDate = new Date(Math.max(regimen.startDate.getTime(), twoYearsAgo.getTime()));
    const endDate = regimen.endDate ? new Date(Math.min(regimen.endDate.getTime(), now.getTime())) : now;
    
    // Get schedule times based on frequency
    let scheduleTimes = [];
    switch (regimen.frequency) {
      case 'once_daily':
        scheduleTimes = ['08:00'];
        break;
      case 'twice_daily':
        scheduleTimes = ['08:00', '20:00'];
        break;
      case 'three_times_daily':
        scheduleTimes = ['08:00', '14:00', '20:00'];
        break;
      case 'four_times_daily':
        scheduleTimes = ['08:00', '12:00', '16:00', '20:00'];
        break;
      default:
        scheduleTimes = ['08:00'];
    }
    
    // Generate dose logs for each day
    const currentDate = new Date(startDate);
    let consecutiveDays = 0;
    let maxStreak = 0;
    
    while (currentDate <= endDate) {
      for (const timeStr of scheduleTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Skip future dates
        if (scheduledTime > now) continue;
        
        // Base adherence rate with some realistic patterns
        let adherenceRate = getAdherenceRate(0.85);
        
        // Lower adherence on weekends for some medications
        if ([0, 6].includes(currentDate.getDay()) && Math.random() < 0.3) {
          adherenceRate *= 0.8;
        }
        
        // Lower adherence during holiday seasons
        const month = currentDate.getMonth();
        if ([11, 0].includes(month) && Math.random() < 0.2) {
          adherenceRate *= 0.7;
        }
        
        // Gradual improvement over time (learning effect)
        const daysSinceStart = Math.floor((currentDate - regimen.startDate) / (1000 * 60 * 60 * 24));
        const improvementFactor = Math.min(1.1, 1 + (daysSinceStart / 3650)); // Slight improvement over 10 years
        adherenceRate *= improvementFactor;
        
        const wasTaken = Math.random() < adherenceRate;
        totalDoses++;
        
        const doseLogData = {
          user: user._id,
          regimen: regimen._id,
          medication: regimen.medication,
          scheduledTime: scheduledTime,
          dosage: regimen.dosage,
          status: wasTaken ? 'taken' : 'missed',
          reminderSent: true
        };
        
        if (wasTaken) {
          takenDoses++;
          consecutiveDays = scheduleTimes.indexOf(timeStr) === scheduleTimes.length - 1 ? consecutiveDays + 1 : consecutiveDays;
          
          // Add some realistic variation to actual time
          const delayMinutes = Math.random() < 0.7 ? 
            Math.floor(Math.random() * 30) : // Usually within 30 minutes
            Math.floor(Math.random() * 120); // Sometimes up to 2 hours late
          
          const actualTime = new Date(scheduledTime.getTime() + (delayMinutes * 60 * 1000));
          doseLogData.actualTime = actualTime;
          doseLogData.takenLate = delayMinutes > 15;
          doseLogData.minutesLate = delayMinutes;
          
          // Add some additional data occasionally
          if (Math.random() < 0.3) {
            doseLogData.withFood = Math.random() < 0.6;
          }
          
          if (Math.random() < 0.15) {
            doseLogData.mood = getRandomElement(['excellent', 'good', 'okay', 'poor']);
          }
          
          if (Math.random() < 0.1) {
            doseLogData.effectiveness = {
              rating: Math.floor(Math.random() * 5) + 1,
              notes: getRandomElement([
                'Feeling better today',
                'No side effects noticed',
                'Slight drowsiness',
                'Good pain relief',
                'Normal response'
              ])
            };
          }
          
          if (Math.random() < 0.05) {
            doseLogData.sideEffects = [getRandomElement(['Mild nausea', 'Slight headache', 'Drowsiness', 'Dry mouth'])];
          }
          
          // Reward points for taking medication
          doseLogData.rewards = {
            points: wasTaken ? (doseLogData.takenLate ? 5 : 10) : 0
          };
        } else {
          missedDoses++;
          consecutiveDays = 0;
        }
        
        maxStreak = Math.max(maxStreak, consecutiveDays);
        
        try {
          const doseLog = new DoseLog(doseLogData);
          await doseLog.save();
        } catch (error) {
          console.error('Error creating dose log:', error);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Update user's adherence stats
  const adherencePercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const rewardPoints = takenDoses * 8; // Average 8 points per dose
  
  await User.findByIdAndUpdate(user._id, {
    'adherenceStats.totalDoses': totalDoses,
    'adherenceStats.takenDoses': takenDoses,
    'adherenceStats.missedDoses': missedDoses,
    'adherenceStats.streakDays': Math.floor(Math.random() * 14) + 1, // Current streak
    'adherenceStats.lastUpdated': new Date(),
    'rewards.points': rewardPoints,
    'rewards.level': Math.floor(rewardPoints / 1000) + 1,
    'rewards.badges': ['Early Bird', 'Consistent', 'Health Champion'],
    'totalRewardPoints': rewardPoints,
    'currentStreak': Math.floor(Math.random() * 14) + 1,
    'longestStreak': Math.floor(Math.random() * 45) + 15
  });
  
  console.log(`Generated ${totalDoses} total dose logs`);
  console.log(`Taken: ${takenDoses}, Missed: ${missedDoses}`);
  console.log(`Overall adherence: ${adherencePercentage}%`);
  console.log(`Reward points: ${rewardPoints}`);
  
  return { totalDoses, takenDoses, missedDoses, adherencePercentage };
};

// Main function to create everything
const generateDummyUser = async () => {
  try {
    await connectDB();
    
    console.log('Creating medications...');
    const medications = await createMedications();
    
    console.log('Creating user...');
    const user = await createUserWithData();
    
    console.log('Creating regimens...');
    const regimens = await createRegimens(user, medications);
    
    console.log('Generating dose logs (this may take a while)...');
    const stats = await generateDoseLogs(user, regimens);
    
    console.log('\n=== DUMMY DATA GENERATION COMPLETE ===');
    console.log(`User created: ${user.email}`);
    console.log(`Medications: ${medications.length}`);
    console.log(`Regimens: ${regimens.length}`);
    console.log(`Total dose logs: ${stats.totalDoses}`);
    console.log(`Adherence rate: ${stats.adherencePercentage}%`);
    console.log('\nYou can now use this data to test your frontend!');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error generating dummy user:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  generateDummyUser();
}

module.exports = generateDummyUser;
