import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seti.app',
  appName: 'SETI',
  webDir: 'dist',
  server: {
    url: 'https://seti-production.up.railway.app',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#05050a",
      androidSplashResourceName: "splash",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#00f2ff"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#05050a"
    }
  }
};

export default config;