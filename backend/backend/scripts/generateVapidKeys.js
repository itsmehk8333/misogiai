const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('=== VAPID Keys Generated Successfully ===\n');
  console.log('Public Key:');
  console.log(vapidKeys.publicKey);
  console.log('\nPrivate Key:');
  console.log(vapidKeys.privateKey);
  console.log('\n=== Copy these keys to your .env file ===');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  
} catch (error) {
  console.error('Error generating VAPID keys:', error);
}
