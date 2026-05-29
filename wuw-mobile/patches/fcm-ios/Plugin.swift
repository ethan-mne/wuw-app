import Foundation
import Capacitor
import UserNotifications

import FirebaseCore
import FirebaseMessaging
import FirebaseInstallations

/**
 * Patched for Winuwatch — see scripts/patch-fcm-ios-plugin.mjs
 * - Skip Firebase when GoogleService-Info.plist missing/invalid
 * - Re-apply APNs before getToken; cache FCM token in UserDefaults
 */
@objc(FCMPlugin)
public class FCMPlugin: CAPPlugin, MessagingDelegate {
    var fcmToken: String?

    override public func load() {
        guard let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: plistPath),
              let appId = plist["GOOGLE_APP_ID"] as? String,
              appId.contains(":ios:"),
              !appId.contains("YOUR_"),
              let apiKey = plist["API_KEY"] as? String,
              apiKey.hasPrefix("AIza"),
              !apiKey.contains("YOUR_")
        else {
            print("[FCM] Valid GoogleService-Info.plist not in app bundle — skipping Firebase")
            return
        }
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        Messaging.messaging().delegate = self
        NotificationCenter.default.addObserver(self, selector: #selector(self.didRegisterWithToken(notification:)), name: .capacitorDidRegisterForRemoteNotifications, object: nil)
    }

    private func wuwReapplyApnsTokenIfNeeded() {
        guard Messaging.messaging().apnsToken == nil,
              let data = UserDefaults.standard.data(forKey: "wuw_last_apns_device_token") else {
            return
        }
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        Messaging.messaging().apnsToken = data
    }

    private func wuwCachedFcmToken() -> String? {
        let token = UserDefaults.standard.string(forKey: "wuw_fcm_registration_token")
        return (token ?? "").isEmpty ? nil : token
    }

    @objc func didRegisterWithToken(notification: NSNotification) {
        guard let deviceToken = notification.object as? Data else {
            return
        }
        Messaging.messaging().apnsToken = deviceToken
    }

    @objc func subscribeTo(_ call: CAPPluginCall) {
        let topicName = call.getString("topic") ?? ""
        Messaging.messaging().subscribe(toTopic: topicName) { error in
            if (error) != nil {
                print("ERROR while trying to subscribe topic \(topicName)")
                call.reject("Can't subscribe to topic \(topicName)")
            } else {
                call.resolve([
                    "message": "subscribed to topic \(topicName)"
                ])
            }
        }
    }

    @objc func unsubscribeFrom(_ call: CAPPluginCall) {
        let topicName = call.getString("topic") ?? ""
        Messaging.messaging().unsubscribe(fromTopic: topicName) { error in
            if (error) != nil {
                call.reject("Can't unsubscribe from topic \(topicName)")
            } else {
                call.resolve([
                    "message": "unsubscribed from topic \(topicName)"
                ])
            }
        }
    }

    @objc func getToken(_ call: CAPPluginCall) {
        wuwReapplyApnsTokenIfNeeded()
        if let cached = wuwCachedFcmToken() {
            self.fcmToken = cached
            call.resolve(["token": cached])
            return
        }
        if (fcmToken ?? "").isEmpty {
            Messaging.messaging().token { token, error in
                if let error = error {
                    print("Error fetching FCM registration token: \(error)")
                    call.reject("Failed to get instance FirebaseID", error.localizedDescription)
                } else if let token = token {
                    print("FCM registration token: \(token)")
                    self.fcmToken = token
                    if !token.isEmpty {
                        UserDefaults.standard.set(token, forKey: "wuw_fcm_registration_token")
                    }
                    call.resolve([
                        "token": token
                    ])
                }
            }
        } else {
            call.resolve([
                "token": fcmToken ?? ""
            ])
        }
    }

    @objc func refreshToken(_ call: CAPPluginCall) {
        wuwReapplyApnsTokenIfNeeded()
        if let cached = wuwCachedFcmToken() {
            self.fcmToken = cached
            call.resolve(["token": cached])
            return
        }
        FirebaseMessaging.Messaging.messaging().deleteData { error in
            guard let error = error else {
                print("Delete FCMToken successful!")
                return
            }
            call.reject("Delete FCMToken failed", error.localizedDescription)
            print("Delete FCMToken failed: \(String(describing: error.localizedDescription))!")
        }

        Messaging.messaging().token { token, error in
            if let error = error {
                print("Error fetching FCM registration token: \(error)")
                call.reject("Failed to get instance FirebaseID", error.localizedDescription)
            } else if let token = token {
                print("FCM registration token: \(token)")
                self.fcmToken = token
                if !token.isEmpty {
                    UserDefaults.standard.set(token, forKey: "wuw_fcm_registration_token")
                }
                call.resolve([
                    "token": token
                ])
            }
        }
    }

    @objc func deleteInstance(_ call: CAPPluginCall) {
        Installations.installations().delete { error in
            if let error = error {
                print("Error deleting installation: \(error)")
                call.reject("Cant delete Firebase Instance ID", error.localizedDescription)
            }
            self.fcmToken = ""
            call.resolve()
        }
    }

    @objc func setAutoInit(_ call: CAPPluginCall) {
        let enabled: Bool = call.getBool("enabled") ?? false
        Messaging.messaging().isAutoInitEnabled = enabled
        call.resolve()
    }

    @objc func isAutoInitEnabled(_ call: CAPPluginCall) {
        call.resolve([
            "enabled": Messaging.messaging().isAutoInitEnabled
        ])
    }

    @objc public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        self.fcmToken = fcmToken
        if let token = fcmToken, !token.isEmpty {
            UserDefaults.standard.set(token, forKey: "wuw_fcm_registration_token")
        }
    }
}
