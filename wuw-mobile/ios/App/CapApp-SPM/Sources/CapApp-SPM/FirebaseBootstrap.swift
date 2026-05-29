import Foundation
import FirebaseCore
import FirebaseMessaging

/// Called from AppDelegate so Firebase is ready before FCM.getToken() (TestFlight / production).
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
        configureIfNeeded()
        Messaging.messaging().apnsToken = deviceToken
    }
}
