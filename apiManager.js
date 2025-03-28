export class ApiManager {
  constructor() {
    // Configura el endpoint de la API y la API key.
    // Asegúrate de reemplazar estos valores según tu entorno o configuraciones.
    this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    this.apiKey = "AIzaSyCwVVhoAAfpni66dmeyzFLF6FHIECgfwv4";
  }

  /**
   * Envía una solicitud a la API de Gemini.
   * @param {string} query - La consulta enriquecida (por ejemplo, con personalidad).
   * @param {Array} chatHistory - Historial de mensajes (puede utilizarse para contextos).
   * @returns {Promise<string>} - La respuesta de la API.
   */
  async sendRequest(query, chatHistory) {
    console.debug("ApiManager.sendRequest -> query:", query, " chatHistory:", chatHistory);
    const payload = {
      contents: [{ parts: [{ text: query }] }]
    };

    try {
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.debug("ApiManager.sendRequest -> data:", data);

      // Se asume que la respuesta se encuentra en data.candidates[0].content.parts[0].text
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        return data.candidates[0]?.content?.parts[0]?.text || "Respuesta vacía.";
      }
      return "No se obtuvo respuesta.";
    } catch (error) {
      console.error("ApiManager.sendRequest error:", error);
      throw error;
    }
  }

  // Método de diagnóstico para confirmar la sintaxis.
  static testSyntax() {
    console.log("✅ ApiManager syntax OK");
    return true;
  }
}