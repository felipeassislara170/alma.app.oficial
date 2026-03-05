
import SwiftUI

struct MainTabView: View {
    
    var body: some View {
        
        TabView {
            
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }
            
            ChatView()
                .tabItem {
                    Label("Alma", systemImage: "bubble.left.and.bubble.right")
                }
            
            InsightsView()
                .tabItem {
                    Label("Insights", systemImage: "chart.bar")
                }
            
            SubscriptionView()
                .tabItem {
                    Label("Premium", systemImage: "star")
                }
            
            ProfileView()
                .tabItem {
                    Label("Perfil", systemImage: "person")
                }
        }
    }
}
