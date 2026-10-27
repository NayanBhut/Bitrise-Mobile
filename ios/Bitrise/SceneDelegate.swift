import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?
  private var privacyView: UIVisualEffectView?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    dependencyProvider = RCTAppDependencyProvider()
    reactNativeFactory = RCTReactNativeFactory(delegate: self)
    window = UIWindow(windowScene: windowScene)

    #if DEBUG
      let devMenuConfiguration = RCTDevMenuConfiguration(
        devMenuEnabled: true,
        shakeGestureEnabled: true,
        keyboardShortcutsEnabled: true
      )
      reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
    #endif

    reactNativeFactory?.startReactNative(
      withModuleName: "Bitrise",
      in: window,
      connectionOptions: connectionOptions
    )
  }

  func sceneWillResignActive(_ scene: UIScene) {
    guard let window = window, privacyView == nil else {
      return
    }

    let blurView = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
    blurView.frame = window.bounds
    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    window.addSubview(blurView)
    privacyView = blurView
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    privacyView?.removeFromSuperview()
    privacyView = nil
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
