
import Foundation

class OpenAIService {
    
    let apiKey = "YOUR_OPENAI_API_KEY"
    
    func sendMessage(message: String, completion: @escaping (String) -> Void) {
        
        let url = URL(string: "https://api.openai.com/v1/chat/completions")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            
            "model": "gpt-4o-mini",
            
            "messages": [
                [
                    "role": "system",
                    "content": "You are Alma, an empathetic emotional mentor helping users reflect on their feelings."
                ],
                [
                    "role": "user",
                    "content": message
                ]
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, _, _ in
            
            guard let data = data else { return }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let choices = json["choices"] as? [[String: Any]],
               let message = choices.first?["message"] as? [String: Any],
               let content = message["content"] as? String {
                
                completion(content)
            }
            
        }.resume()
    }
}
