
import SwiftUI
import FirebaseFirestore

struct HomeView: View {
    
    @State private var mood = ""
    @State private var streak = 0
    
    let db = Firestore.firestore()
    
    var body: some View {
        
        ScrollView {
            
            VStack(spacing: 25) {
                
                Text("Bom dia ☀️")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("🔥 \(streak) dias cuidando da sua mente")
                    .foregroundColor(.gray)
                
                VStack(alignment: .leading) {
                    
                    Text("Check-in emocional")
                        .font(.headline)
                    
                    TextField("Como você está hoje?", text: $mood)
                        .textFieldStyle(.roundedBorder)
                    
                    Button("Salvar check-in") {
                        saveMood()
                    }
                    
                }
                .padding()
                .background(AlmaTheme.card)
                .cornerRadius(20)
                
                NavigationLink("Conversar com Alma") {
                    ChatView()
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(AlmaTheme.accent)
                .cornerRadius(20)
                
            }
            .padding()
        }
        .background(AlmaTheme.background)
    }
    
    func saveMood() {
        
        db.collection("moods").addDocument(data: [
            "text": mood,
            "date": Date()
        ])
        
        streak += 1
        
        db.collection("streak").addDocument(data: [
            "value": streak,
            "date": Date()
        ])
        
        mood = ""
    }
}
