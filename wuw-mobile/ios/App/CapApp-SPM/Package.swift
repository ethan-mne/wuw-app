// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.0"),
        .package(name: "CapacitorApp", path: "../../../../node_modules/.pnpm/@capacitor+app@8.1.0_@capacitor+core@8.4.0/node_modules/@capacitor/app"),
        .package(name: "CapacitorLocalNotifications", path: "../../../../node_modules/.pnpm/@capacitor+local-notifications@8.2.0_@capacitor+core@8.4.0/node_modules/@capacitor/local-notifications"),
        .package(name: "CapacitorPushNotifications", path: "../../../../node_modules/.pnpm/@capacitor+push-notifications@8.1.1_@capacitor+core@8.4.0/node_modules/@capacitor/push-notifications"),
        .package(name: "CapacitorSplashScreen", path: "../../../../node_modules/.pnpm/@capacitor+splash-screen@8.0.1_@capacitor+core@8.4.0/node_modules/@capacitor/splash-screen"),
        .package(name: "OnesignalCapacitorPlugin", path: "../../../node_modules/@onesignal/capacitor-plugin")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorLocalNotifications", package: "CapacitorLocalNotifications"),
                .product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications"),
                .product(name: "CapacitorSplashScreen", package: "CapacitorSplashScreen"),
                .product(name: "OnesignalCapacitorPlugin", package: "OnesignalCapacitorPlugin")
            ]
        )
    ]
)
