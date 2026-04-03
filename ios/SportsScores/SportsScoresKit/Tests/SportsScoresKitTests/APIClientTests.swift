import XCTest
@testable import SportsScoresKit

final class APIClientTests: XCTestCase {
    func testFetchDecodesValidResponse() async throws {
        let json = #"{"sport":"nba","teams":[{"id":"1","name":"Hawks","abbreviation":"ATL","logo":"https://example.com/atl.png","color":"c8102e"}]}"#
        let url = URL(string: "https://example.com/test")!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data(json.utf8))
        }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        let client = APIClient(session: session)

        let result: TeamsResponse = try await client.fetch(url)
        XCTAssertEqual(result.sport, "nba")
        XCTAssertEqual(result.teams.count, 1)
        XCTAssertEqual(result.teams[0].name, "Hawks")
    }

    func testFetchThrowsOnServerError() async {
        let url = URL(string: "https://example.com/test")!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        let client = APIClient(session: session)

        do {
            let _: TeamsResponse = try await client.fetch(url)
            XCTFail("Should have thrown")
        } catch let error as APIError {
            if case .invalidResponse(let code) = error {
                XCTAssertEqual(code, 500)
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testFetchThrowsOnInvalidJSON() async {
        let url = URL(string: "https://example.com/test")!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data("not json".utf8))
        }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        let client = APIClient(session: session)

        do {
            let _: TeamsResponse = try await client.fetch(url)
            XCTFail("Should have thrown")
        } catch let error as APIError {
            if case .decodingError = error {
                // Expected
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}

// MARK: - Mock URL Protocol

final class MockURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            XCTFail("No request handler set")
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
