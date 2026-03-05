
import SwiftUI

struct MessageBubble: View {
    
    var message: String
    var isUser: Bool
    
    var body: some View {
        
        HStack {
            
            if isUser { Spacer() }
            
            Text(message)
                .padding()
                .background(isUser ? AlmaTheme.accent : AlmaTheme.card)
                .cornerRadius(18)
            
            if !isUser { Spacer() }
        }
        .padding(.horizontal)
    }
}
