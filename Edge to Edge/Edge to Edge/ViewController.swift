//
//  ViewController.swift
//  Edge to Edge
//
//  Created by Javi on 24/10/26.
//

import SwiftUI
import UIKit
import WebKit

class ViewController: UIViewController {

    // Still wired in Main.storyboard; the SwiftUI screen replaces it.
    @IBOutlet var webView: WKWebView?

    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.removeFromSuperview()

        let host = UIHostingController(rootView: HomeView())
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        host.didMove(toParent: self)
    }

}

struct HomeView: View {

    private let steps = [
        ("gear", "Open **Settings › Apps › Safari › Extensions**."),
        ("switch.2", "Tap **Edge to Edge**, turn on **Allow Extension** and set **All Websites** to **Allow**."),
        ("iphone", "Fold your iPhone and browse in Safari. Pages now reach the edge of the outer display."),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                VStack(spacing: 12) {
                    Image("LargeIcon")
                        .resizable()
                        .frame(width: 96, height: 96)
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                    Text("Edge to Edge")
                        .font(.largeTitle.bold())
                    Text("Use the whole outer display in Safari, without the empty strip at the side.")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                HStack(spacing: 24) {
                    PhonePreview(filled: false, label: "Before")
                    PhonePreview(filled: true, label: "After")
                }

                VStack(alignment: .leading, spacing: 16) {
                    Text("Turn it on")
                        .font(.title3.bold())
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 14) {
                            Text("\(index + 1)")
                                .font(.headline)
                                .foregroundStyle(.white)
                                .frame(width: 28, height: 28)
                                .background(Circle().fill(Color.accentColor))
                            Text(.init(step.1))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(Color(.secondarySystemBackground)))

                VStack(spacing: 6) {
                    Label("Free, no ads, collects no data.", systemImage: "hand.raised")
                    Text("Only pages built for phone screens are changed. Tap the round button in Safari's strip to turn it off or on for a site.")
                        .multilineTextAlignment(.center)
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 32)
            .frame(maxWidth: 520)
            .frame(maxWidth: .infinity)
        }
        .background(Color(.systemBackground))
    }

}

/// Sketch of the folded phone in Safari: the page stops short of the side
/// strip, or reaches the edge.
private struct PhonePreview: View {

    let filled: Bool
    let label: String

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color(.tertiarySystemFill))
                HStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 6) {
                        RoundedRectangle(cornerRadius: 3).fill(Color.accentColor).frame(height: 14)
                        ForEach(0..<6, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 2).fill(Color.primary.opacity(0.25)).frame(height: 5)
                        }
                        Spacer()
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemBackground))
                    if !filled {
                        Color.clear.frame(width: 22)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(4)
                Circle()
                    .fill(Color.primary)
                    .frame(width: 9, height: 9)
                    .padding(.top, 10)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(.trailing, 10)
            }
            .frame(width: 110, height: 160)
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(filled ? Color.accentColor : .secondary)
        }
    }

}
