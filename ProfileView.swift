
import SwiftUI
import FirebaseAuth

struct ProfileView: View {
    
    var body: some View {
        
        VStack(spacing: 20) {
            
            Text("Perfil")
                .font(.largeTitle)
            
            Text("Usuário conectado")
            
            Button("Sair") {
                try? Auth.auth().signOut()
            }
        }
        .padding()
    }
}
