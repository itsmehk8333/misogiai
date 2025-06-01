# Generate Dummy User Data for MedTracker

This script creates a comprehensive test user with 2 years of medication tracking data for your MedTracker application.

## What it creates:

### User Profile
- **Name**: John Doe
- **Email**: john.doe.medtracker@example.com
- **Password**: password123
- **Phone**: +1-555-0123
- **Date of Birth**: March 15, 1980

### Medications (6 total)
1. **Lisinopril** 10mg - Heart & Blood Pressure (Daily)
2. **Metformin** 500mg - Diabetes (Twice daily)
3. **Vitamin D3** 2000 IU - Vitamins & Supplements (Daily)
4. **Omeprazole** 20mg - Digestive (Daily, discontinued after 6 months)
5. **Sertraline** 50mg - Mental Health (Daily, started 5 months ago)
6. **Multivitamin** - Vitamins & Supplements (Daily)

### Data Generated
- **Time Range**: Past 2 years from current date
- **Total Dose Logs**: ~4,500+ entries
- **Realistic Adherence**: 80-90% with natural variations
- **Patterns Include**:
  - Lower adherence on weekends
  - Holiday season variations
  - Gradual improvement over time
  - Realistic timing variations (early/late doses)
  - Side effects and effectiveness ratings
  - Mood tracking
  - Reward points and achievements

### Features Demonstrated
- Multiple medication schedules
- Active and discontinued medications
- Family group setup
- Emergency contacts
- Notification preferences
- Adherence statistics
- Reward system with points and badges
- Refill reminders
- Doctor information

## Usage

1. Make sure your MongoDB connection is configured in `.env`
2. Run the script:
   ```bash
   cd backend
   node scripts/generateDummyUser.js
   ```

## Login Credentials
- **Email**: john.doe.medtracker@example.com
- **Password**: password123

## Database Collections Populated
- `users` - 1 comprehensive user profile
- `medications` - 6 realistic medications
- `regimens` - 6 medication regimens with different schedules
- `doselogs` - ~4,500+ dose logging entries spanning 2 years

This data will give you a rich dataset to test all frontend features including:
- Dashboard with adherence statistics
- Medication management
- Dose logging history
- Reports and analytics
- Reward system
- Calendar integration
- Notification settings
