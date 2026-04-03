import SwiftUI
import Combine
import SportsScoresKit

@Observable
final class BoxScoreViewModel {
    // MARK: - Properties

    var boxScore: BoxScoreResponse?
    var isLoading = false
    var error: String?

    let sport: Sport
    let eventId: String
    private let apiClient: APIClientProtocol
    private var timerCancellable: AnyCancellable?

    // MARK: - Init

    init(sport: Sport, eventId: String, apiClient: APIClientProtocol = APIClient()) {
        self.sport = sport
        self.eventId = eventId
        self.apiClient = apiClient
    }

    // MARK: - Loading

    func load() {
        Task { @MainActor in
            isLoading = boxScore == nil
            error = nil

            do {
                let url = Endpoints.boxScore(sport: sport, eventId: eventId)
                let response: BoxScoreResponse = try await apiClient.fetch(url)
                boxScore = response
            } catch {
                self.error = error.localizedDescription
            }

            isLoading = false
        }
    }

    // MARK: - Polling

    func startPolling() {
        guard boxScore?.status == .live || boxScore == nil else { return }
        timerCancellable = Timer.publish(every: 30, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self, self.boxScore?.status == .live else {
                    self?.stopPolling()
                    return
                }
                self.load()
            }
    }

    func stopPolling() {
        timerCancellable?.cancel()
        timerCancellable = nil
    }
}
