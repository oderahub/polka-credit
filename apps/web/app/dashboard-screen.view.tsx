"use client";

import { useDashboardViewModel } from "./use-dashboard-view-model";

function shortAddress(value: string) {
  if (!value || value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function isEligible(summary: string) {
  return summary.toLowerCase().startsWith("eligible");
}

export function DashboardScreenView() {
  const viewModel = useDashboardViewModel();
  const canCheckEligibility = viewModel.walletConnected && viewModel.verificationStatus !== "submitting";
  const canSubmitCertificate = canCheckEligibility && isEligible(viewModel.eligibilitySummary);
  const score = Number(viewModel.quoteScoreValue || "0");
  const flowCompleted = viewModel.flowCompleted;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-frame">
        <header className="topbar">
          <div className="brand-block">
            <p className="eyebrow">Premium Credit Flow</p>
            <h1 className="brand-title">PolkaZK Credit</h1>
            <p className="brand-copy">Private reputation becomes a reusable on-chain credit signal.</p>
          </div>

          <div className="topbar-side">
            <div className="wallet-badge">
              <span className="wallet-badge-label">Wallet Session</span>
              <code>{viewModel.walletConnectionLabel}</code>
            </div>
            <button type="button" className="button button-primary" onClick={viewModel.connectWallet}>
              {viewModel.walletConnected ? "Reconnect Wallet" : "Connect Wallet"}
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <article className="hero-panel">
            <div className="hero-copy-wrap">
              <p className="eyebrow">One Clean Dashboard</p>
              <h2 className="hero-title">Run the full score issuance flow from one premium screen.</h2>
              <p className="hero-copy">
                Connect your wallet, verify governance eligibility, submit the attested certificate,
                and inspect the refreshed score and lending quote without hunting for the next action.
              </p>
            </div>

            <div className="explain-strip">
              <div className="explain-card">
                <span>Certificate</span>
                <strong>Off-chain proof</strong>
                <p>Presented once after eligibility passes.</p>
              </div>
              <div className="explain-card">
                <span>Verifier</span>
                <strong>Checks and binds</strong>
                <p>Adapter verifies the proof against your wallet.</p>
              </div>
              <div className="explain-card">
                <span>SBT</span>
                <strong>On-chain credential</strong>
                <p>Permanent, reusable, and composable in lending.</p>
              </div>
            </div>

            <div className="proof-strip">
              <div
                className="proof-chip"
                title="toAccountId(address) cross-VM binding"
              >
                <span>System</span>
                <code>{viewModel.systemPrecompileAddressLabel}</code>
              </div>
              <div className="proof-chip" title="Governance attestation adapter contract">
                <span>Adapter</span>
                <code>{shortAddress(viewModel.adapterAddressLabel.replace("Adapter: ", ""))}</code>
              </div>
              <div
                className="proof-chip"
                title="USDT via ERC20 precompile (Asset ID 1984)"
              >
                <span>Native asset</span>
                <code>{viewModel.nativeAssetIdLabel}</code>
              </div>
            </div>

            <div className="metric-strip">
              <article className="metric-card">
                <span className="metric-label">Live Score</span>
                <strong className="metric-value">{viewModel.quoteScoreValue}</strong>
                <span className="metric-note">{viewModel.quoteScoreLabel}</span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Current APR</span>
                <strong className="metric-value">{viewModel.quoteAprLabel.replace("APR ", "")}</strong>
                <span className="metric-note">Baseline {viewModel.beforeQuoteAprLabel.replace("APR ", "")}</span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Borrow Cap</span>
                <strong className="metric-value">{viewModel.quoteBorrowCapLabel.replace("Borrow cap ", "")}</strong>
                <span className="metric-note">Baseline {viewModel.beforeQuoteBorrowCapLabel.replace("Borrow cap ", "")}</span>
              </article>
            </div>
          </article>

          <aside className="action-rail">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Action Rail</p>
                <h3 className="panel-title">Run the flow in order</h3>
              </div>
              <span className={`status-pill status-${viewModel.screenState}`}>{viewModel.statusLabel}</span>
            </div>

            <p className="panel-copy">
              The local development build allows full-flow testing with any connected wallet on
              Polkadot Hub Testnet.
            </p>

            {viewModel.certificateReadyLabel ? (
              <div className="ready-badge">{viewModel.certificateReadyLabel}</div>
            ) : null}

            <div className="button-stack">
              <button type="button" className="button button-secondary" onClick={viewModel.connectWallet}>
                {viewModel.walletConnected ? "Reconnect Wallet" : "Connect Wallet"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => void viewModel.refreshLiveState()}
                disabled={viewModel.isRefreshing || viewModel.verificationStatus === "submitting"}
              >
                {viewModel.isRefreshing ? "Refreshing..." : "Refresh Live State"}
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => void viewModel.handleCheckEligibility()}
                disabled={!canCheckEligibility}
              >
                {viewModel.verificationStatus === "submitting" ? "Checking..." : "Check Eligibility"}
              </button>
              <button
                type="button"
                className={`button ${canSubmitCertificate ? "button-primary" : "button-accent"}`}
                onClick={() => void viewModel.handleSubmitProof()}
                disabled={!canSubmitCertificate}
              >
                Submit Certificate
              </button>
            </div>

            <div className="mini-steps">
              <div className="mini-step"><span>1</span><p>Connect wallet</p></div>
              <div className="mini-step"><span>2</span><p>Check eligibility</p></div>
              <div className="mini-step"><span>3</span><p>Submit certificate</p></div>
            </div>
          </aside>
        </section>

        <section className="status-grid">
          <article className="panel status-card">
            <p className="eyebrow">Current Status</p>
            <h3 className="panel-title">What the app thinks is happening</h3>
            <div className={`status-banner status-banner-${viewModel.screenState}`}>
              {viewModel.currentStatusMessage}
            </div>
            {viewModel.transactionHashLabel ? (
              <div className="inline-meta">
                <span>Transaction</span>
                <code>{viewModel.transactionHashLabel}</code>
              </div>
            ) : null}
          </article>

          <article className="panel status-card">
            <p className="eyebrow">Eligibility</p>
            <h3 className="panel-title">Can this wallet proceed?</h3>
            <div className={`result-card ${isEligible(viewModel.eligibilitySummary) ? "result-success" : ""}`}>
              <strong>{viewModel.eligibilitySummary}</strong>
              <p>{viewModel.eligibilitySource}</p>
              <p>{viewModel.eligibilityConvictionBucket}</p>
              <code>{viewModel.eligibilityDatasetId}</code>
            </div>
          </article>

          <article className="panel status-card">
            <p className="eyebrow">Proof to Credential</p>
            <h3 className="panel-title">What gets submitted once</h3>
            <div className={`result-card ${viewModel.issuedCertificateTierLabel ? "result-success" : ""}`}>
              <strong>{viewModel.certificateStatusMessage}</strong>
              <p>{viewModel.issuedCertificateIssuedBy || "Waiting for certificate issuance."}</p>
              <p>{viewModel.issuedCertificateSource || "The attester service will issue the payload after eligibility passes."}</p>
              <code>{viewModel.issuedCertificateDatasetId || "Dataset pending"}</code>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <div className="content-main">
            <article className={`panel outcome-panel ${flowCompleted ? "outcome-panel-complete" : ""}`}>
              <p className="eyebrow">Live Outcome</p>
              <h3 className="panel-title">Score and quote</h3>
              <div className="outcome-grid">
                <div className={`outcome-card ${flowCompleted ? "outcome-card-complete" : ""}`}>
                  <span>Score</span>
                  <strong>{viewModel.quoteScoreValue}</strong>
                  <p>{viewModel.quoteScoreLabel}</p>
                </div>
                <div className={`outcome-card ${flowCompleted ? "outcome-card-complete" : ""}`}>
                  <span>APR</span>
                  <strong>{viewModel.quoteAprLabel.replace("APR ", "")}</strong>
                  <p>Baseline {viewModel.beforeQuoteAprLabel.replace("APR ", "")}</p>
                </div>
                <div className={`outcome-card ${flowCompleted ? "outcome-card-complete" : ""}`}>
                  <span>Borrow Cap</span>
                  <strong>{viewModel.quoteBorrowCapLabel.replace("Borrow cap ", "")}</strong>
                  <p>Baseline {viewModel.beforeQuoteBorrowCapLabel.replace("Borrow cap ", "")}</p>
                </div>
                <div className={`outcome-card ${flowCompleted ? "outcome-card-complete" : ""}`}>
                  <span>Completion</span>
                  <strong>{flowCompleted ? "Complete" : "In Progress"}</strong>
                  <p>{flowCompleted ? "Score and quote refreshed on-chain." : "Approve the transaction in MetaMask to finish."}</p>
                </div>
              </div>
            </article>

            <article className="panel flow-panel">
              <p className="eyebrow">Flow Progress</p>
              <h3 className="panel-title">Step-by-step state</h3>
              <div className="flow-list">
                <div className={`flow-row ${viewModel.walletConnected ? "flow-done" : ""}`}>
                  <span className="flow-index">1</span>
                  <div><strong>Connect wallet</strong><p>{viewModel.walletConnected ? shortAddress(viewModel.walletAddress) : "Waiting for wallet connection."}</p></div>
                </div>
                <div className={`flow-row ${isEligible(viewModel.eligibilitySummary) ? "flow-done" : ""}`}>
                  <span className="flow-index">2</span>
                  <div><strong>Check eligibility</strong><p>{viewModel.eligibilitySummary}</p></div>
                </div>
                <div className={`flow-row ${Boolean(viewModel.issuedCertificateTierLabel) ? "flow-done" : ""}`}>
                  <span className="flow-index">3</span>
                  <div><strong>Issue certificate proof</strong><p>{viewModel.certificateStatusMessage}</p></div>
                </div>
                <div className={`flow-row ${flowCompleted ? "flow-done" : ""}`}>
                  <span className="flow-index">4</span>
                  <div><strong>Verify and mint SBT</strong><p>{flowCompleted ? `Live score refreshed to ${score}.` : "Approve the transaction in MetaMask to finish."}</p></div>
                </div>
              </div>
            </article>
          </div>

          <div className="content-side">
            <article className="panel infra-panel">
              <p className="eyebrow">On-chain Proof</p>
              <h3 className="panel-title">Contracts and native path</h3>
              <div className="detail-list">
                <div className="detail-row"><span>Claimant</span><code>{viewModel.proofPayloadClaimant}</code></div>
                <div className="detail-row"><span>System</span><code>{viewModel.systemPrecompileAddressLabel}</code></div>
                <div className="detail-row"><span>Adapter</span><code>{viewModel.adapterAddressLabel}</code></div>
                <div className="detail-row"><span>Lending</span><code>{viewModel.lendingDemoAddressLabel}</code></div>
                <div className="detail-row"><span>Score token</span><code>{viewModel.scoreTokenAddressLabel}</code></div>
                <div className="detail-row"><span>Native asset</span><code>{viewModel.nativeAssetIdLabel} · {shortAddress(viewModel.nativeAssetAddress)}</code></div>
              </div>
            </article>

            <article className="activity-wrap panel">
              <p className="eyebrow">Recent Activity</p>
              <h3 className="panel-title">Latest events</h3>
              <div className="activity-list">
                {viewModel.activityLog.slice(0, 6).map((entry, index) => (
                  <div key={`${entry}-${index}`} className="activity-item">
                    <span className="activity-dot" />
                    <p>{entry}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
