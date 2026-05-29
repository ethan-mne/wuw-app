import Foundation
import FirebaseCore
import FirebaseMessaging

private let apnsUserDefaultsKey = "wuw_last_apns_device_token"

/// Firebase init + APNs token bridging for TestFlight (FCM token via patched @capacitor-community/fcm).
public enum FirebaseBootstrap {
    public static func configureIfNeeded() {
        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
            print("[FirebaseBootstrap] GoogleService-Info.plist not in app bundle — skipping FirebaseApp.configure()")
            return
        }
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
            print("[FirebaseBootstrap] FirebaseApp.configure() OK")
        }
    }

    public static func setApnsToken(_ deviceToken: Data) {
        UserDefaults.standard.set(deviceToken, forKey: apnsUserDefaultsKey)
        configureIfNeeded()
        Messaging.messaging().apnsToken = deviceToken
    }

    public static func reapplyApnsTokenIfNeeded() {
        guard Messaging.messaging().apnsToken == nil,
              let data = UserDefaults.standard.data(forKey: apnsUserDefaultsKey) else {
            return
        }
        configureIfNeeded()
        Messaging.messaging().apnsToken = data
        print("[FirebaseBootstrap] Re-applied APNs token to Firebase Messaging")
    }
}
