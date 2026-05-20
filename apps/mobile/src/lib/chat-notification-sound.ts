import { Audio } from 'expo-av';

let sound: Audio.Sound | null = null;
let isLoading = false;

export async function playChatNotificationSound() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true
    });

    if (!sound && !isLoading) {
      isLoading = true;
      const loaded = await Audio.Sound.createAsync(require('../../assets/sounds/new-message.mp3'), {
        shouldPlay: false,
        volume: 0.85
      });
      sound = loaded.sound;
      isLoading = false;
    }

    if (!sound) return;
    await sound.replayAsync();
  } catch {
    isLoading = false;
  }
}

export async function unloadChatNotificationSound() {
  try {
    await sound?.unloadAsync();
  } catch {
    /* ignore */
  } finally {
    sound = null;
    isLoading = false;
  }
}
