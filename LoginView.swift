
import SwiftUI
import FirebaseAuth

struct LoginView: View {
    
    @Binding var logged: Bool
    
    var body: some View {
        
        VStack(spacing: 25) {
            
            Text("Alma")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Seu mentor emocional diário")
                .foregroundColor(.gray)
            
            Button("Entrar anonimamente") {
                Auth.auth().signInAnonymously { result, error in
                    if error == nil {
                        logged = true
                    }
                }
            }
        }
        .padding()
    }
}
