import { dbService } from './src/services/db';

async function run() {
  try {
    await dbService.updateSettings({
      whatsapp: '0552823677',
      whatsappSaudi: '0552823677',
      contactPhone: '0552823677',
      contactPhoneSaudi: '0552823677'
    });
    console.log('Successfully updated phone number to 0552823677');
  } catch (err) {
    console.error('Error updating phone number:', err);
  }
}

run();
