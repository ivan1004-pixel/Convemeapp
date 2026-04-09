import { useState, useEffect } from 'react';
import * as Camera from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';

export const useAppPermissions = () => {
  const [permissions, setPermissions] = useState({
    camera: false,
    mediaLibrary: false,
  });

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setPermissions(prev => ({ ...prev, camera: granted }));
    return granted;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermissions(prev => ({ ...prev, mediaLibrary: granted }));
    return granted;
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  return {
    permissions,
    requestCameraPermission,
    requestMediaLibraryPermission,
    copyToClipboard,
  };
};
