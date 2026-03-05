
import SwiftUI
import FirebaseFirestore

struct InsightsView: View {
    
    @State private var moods: [String] = []
    
    let db = Firestore.firestore()
    
    var body: some View {
        
        List(moods, id: \.self) { mood in
            Text(mood)
        }
        .navigationTitle("Insights")
        .onAppear {
            load()
        }
    }
    
    func load() {
        
        db.collection("moods")
            .order(by: "date", descending: true)
            .limit(to: 20)
            .getDocuments { snap, error in
                
                guard let docs = snap?.documents else { return }
                
                moods = docs.compactMap { $0["text"] as? String }
            }
    }
}
