
import SwiftUI
import StoreKit

struct SubscriptionView: View {
    
    var body: some View {
        
        VStack(spacing: 25) {
            
            Text("Alma Premium")
                .font(.largeTitle)
            
            Text("7 dias grátis • 4,99€/mês")
                .foregroundColor(.gray)
            
            Button("Começar teste grátis") {
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .padding()
    }
}
