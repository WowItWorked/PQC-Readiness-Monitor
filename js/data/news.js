/* PQC Readiness Monitor — curated intelligence content (authoritative backbone).
   Every item links to an official source. Standards & Policy is restricted to
   official U.S., U.K., and EU government bodies. Guidance is best-practice and
   implementation material from NIST/NCCoE, CISA/NSA, UK NCSC, ENISA, and the
   financial sector (FS-ISAC, FSSCC). Sector and Third-Party items each link to
   their source. All URLs were verified live when this snapshot was compiled.
   The live feeds in feeds.js extend each section on every page load. */

window.PQC_NEWS = {
  asOf: "November 24, 2026",
  // Last curated research pass (update when ratings / intelligence are reviewed).
  ratingsReviewed: "June 2026",
  intelReviewed: "June 2026",

  /* ---- Standards & Policy — official U.S. / U.K. / EU government only ------ */
  standards: [
    { d: "2026-01", tag: "UK Gov", title: "HM Treasury: Coordinated roadmap for PQC transition in the financial sector",
      body: "The G7 Cyber Expert Group roadmap, co-chaired by HM Treasury and the Bank of England, sets a six-phase framework for banks, insurers, and exchanges and targets critical financial systems for migration by 2030–2032.",
      src: "GOV.UK · HM Treasury", url: "https://www.gov.uk/government/publications/advancing-a-coordinated-roadmap-for-the-transition-to-post-quantum-cryptography-in-the-financial-sector" },
    { d: "2025-11", tag: "UK Gov", title: "DSIT: Perspectives on the plan for PQC transition",
      body: "The UK Department for Science, Innovation and Technology sets out national thinking on sequencing the post-quantum migration across critical sectors.",
      src: "GOV.UK · DSIT", url: "https://www.gov.uk/government/publications/perspectives-on-the-plan-for-pqc-transition" },
    { d: "2025-06", tag: "EU", title: "EU coordinated implementation roadmap for the PQC transition",
      body: "The NIS Cooperation Group roadmap asks member states to begin cryptographic inventories and national strategies, transitioning high-risk critical-infrastructure use cases by end-2030 and medium-risk by end-2035.",
      src: "European Commission", url: "https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography" },
    { d: "2024-11", tag: "US · NIST", title: "NIST IR 8547: RSA and ECC deprecated after 2030, disallowed after 2035",
      body: "NIST's transition report puts concrete sunset dates on quantum-vulnerable algorithms — 112-bit-security RSA/ECC deprecated after 2030 and disallowed after 2035 — anchoring nearly every bank migration timeline now in circulation.",
      src: "NIST CSRC", url: "https://csrc.nist.gov/pubs/ir/8547/ipd" },
    { d: "2024-08", tag: "US · NIST", title: "FIPS 203 — ML-KEM (key encapsulation) finalized",
      body: "The module-lattice key-encapsulation standard (formerly Kyber) became final on August 13, 2024. NIST's guidance: it can and should be put into use now.",
      src: "NIST CSRC", url: "https://csrc.nist.gov/pubs/fips/203/final" },
    { d: "2024-08", tag: "US · NIST", title: "FIPS 204 — ML-DSA (digital signatures) finalized",
      body: "The module-lattice digital-signature standard (formerly Dilithium) became final on August 13, 2024 — the primary post-quantum signature scheme for most use cases.",
      src: "NIST CSRC", url: "https://csrc.nist.gov/pubs/fips/204/final" },
    { d: "2024-08", tag: "US · NIST", title: "FIPS 205 — SLH-DSA (hash-based signatures) finalized",
      body: "The stateless hash-based signature standard (SPHINCS+) became final on August 13, 2024, giving migration programs a conservative signature option not based on lattices.",
      src: "NIST CSRC", url: "https://csrc.nist.gov/pubs/fips/205/final" },
    { d: "2024-04", tag: "EU", title: "European Commission Recommendation on Post-Quantum Cryptography",
      body: "The Commission recommends a coordinated EU approach so member states develop aligned PQC transition strategies and avoid fragmentation across the single market.",
      src: "European Commission", url: "https://digital-strategy.ec.europa.eu/en/news/commission-publishes-recommendation-post-quantum-cryptography" },
    { d: "2023-11", tag: "UK Gov", title: "UK NCSC: Preparing for quantum-safe cryptography",
      body: "The National Cyber Security Centre's white paper sets out how organisations should plan migration to quantum-safe cryptography, emphasising cryptographic discovery and a managed, risk-based transition.",
      src: "NCSC (UK)", url: "https://www.ncsc.gov.uk/whitepaper/preparing-for-quantum-safe-cryptography" },
    { d: "2023-08", tag: "US Policy", title: "CISA/NSA/NIST: Quantum-Readiness — Migration to Post-Quantum Cryptography",
      body: "The joint factsheet urges organisations to create quantum-readiness roadmaps, inventory cryptography, and engage vendors now — the U.S. government's baseline call to action for critical infrastructure.",
      src: "CISA", url: "https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography" },
    { d: "2022-05", tag: "EU", title: "ENISA: Post-Quantum Cryptography — current state and quantum mitigation",
      body: "ENISA's technical study surveys the post-quantum landscape and mitigation strategies for EU stakeholders, including hybrid schemes and crypto-agility guidance.",
      src: "ENISA", url: "https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation" },
  ],

  /* ---- Implementation Guidance — best practices, each linked to its source - */
  guidance: [
    { icon: "search", title: "Know where you use encryption — and keep that list current",
      body: "The first step is finding every place the organization relies on encryption: systems, applications, certificates, and providers. U.S. government guidance treats this as an ongoing program, not a one-off exercise. Large institutions report that the first full inventory alone takes 12–24 months.",
      src: "NIST NCCoE · SP 1800-38", url: "https://csrc.nist.gov/pubs/sp/1800/38/iprd" },
    { icon: "clock", title: "Protect long-lived sensitive data first",
      body: "Information that must stay confidential for many years — customer records, account data, contracts — is at risk today, because it can be stolen now and decrypted later. U.S. government guidance says to identify that data and move it to quantum-safe protection first.",
      src: "CISA / NSA / NIST", url: "https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography" },
    { icon: "lock", title: "Secure websites and online connections early",
      body: "Switching public websites and online services to quantum-safe encryption is often a settings change, because modern browsers and cloud and hosting providers already support it. The UK's National Cyber Security Centre highlights this as an early, high-value step.",
      src: "NCSC (UK)", url: "https://www.ncsc.gov.uk/whitepaper/preparing-for-quantum-safe-cryptography" },
    { icon: "git-branch", title: "Make future changes easy, not a one-time swap",
      body: "Encryption standards will keep evolving over the next 10–20 years. Guidance recommends managing encryption centrally, so it can be updated through configuration rather than by rewriting systems each time.",
      src: "NIST NCCoE · SP 1800-38", url: "https://csrc.nist.gov/pubs/sp/1800/38/iprd" },
    { icon: "building-2", title: "Engage your key providers now",
      body: "For most regional institutions, the timeline is effectively set by core banking and digital-banking providers. The sector's information-sharing body, FS-ISAC, urges members to ask about quantum-safe plans in due-diligence questionnaires and contract renewals this cycle, including a list of where each product uses encryption.",
      src: "FS-ISAC", url: "https://www.fsisac.com/knowledge" },
    { icon: "file-check", title: "Govern it like any other operational risk",
      body: "There is no specific U.S. legal deadline for private-sector firms yet, but existing banking rules and examinations already expect encryption risk to be managed. The Financial Services Sector Coordinating Council frames this as an operational-resilience issue that boards can oversee today.",
      src: "FSSCC", url: "https://fsscc.org" },
    { icon: "users", title: "Use existing industry roadmaps",
      body: "Financial-sector groups and governments have already published step-by-step roadmaps — including FS-ISAC's sector guidance and the G7 roadmap from HM Treasury and the Bank of England — that give boards a yardstick for progress without building a method from scratch.",
      src: "GOV.UK · HM Treasury", url: "https://www.gov.uk/government/publications/advancing-a-coordinated-roadmap-for-the-transition-to-post-quantum-cryptography-in-the-financial-sector" },
  ],

  /* ---- Authoritative guidance documents (shown beneath the principle cards) - */
  guidanceDocs: [
    { d: "2024", tag: "NIST NCCoE", title: "SP 1800-38: Migration to Post-Quantum Cryptography (practice guide)",
      body: "The NCCoE's hands-on practice guide for discovering quantum-vulnerable cryptography and planning interoperable migration, developed with technology and financial-sector collaborators.",
      src: "NIST NCCoE", url: "https://csrc.nist.gov/pubs/sp/1800/38/iprd" },
    { d: "2023-08", tag: "CISA", title: "Quantum-Readiness: Migration to Post-Quantum Cryptography",
      body: "Joint CISA/NSA/NIST guidance: build a quantum-readiness roadmap, inventory cryptography, and engage vendors — the U.S. baseline for critical infrastructure including financial services.",
      src: "CISA / NSA / NIST", url: "https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography" },
    { d: "2023", tag: "CISA", title: "CISA Post-Quantum Cryptography Initiative",
      body: "CISA's program hub coordinating U.S. critical-infrastructure PQC migration, with resources, the quantum-readiness roadmap, and sector engagement materials.",
      src: "CISA", url: "https://www.cisa.gov/quantum" },
    { d: "2023-11", tag: "NCSC (UK)", title: "Preparing for quantum-safe cryptography",
      body: "NCSC white paper on planning a managed, risk-based migration to quantum-safe cryptography, with emphasis on cryptographic discovery and prioritisation.",
      src: "NCSC (UK)", url: "https://www.ncsc.gov.uk/whitepaper/preparing-for-quantum-safe-cryptography" },
    { d: "2022-05", tag: "ENISA", title: "Post-Quantum Cryptography: current state and quantum mitigation",
      body: "ENISA's technical guidance for EU stakeholders on PQC migration strategies, hybrid deployments, and crypto-agility.",
      src: "ENISA", url: "https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation" },
    { d: "2025", tag: "Technology", title: "IBM Quantum Safe — enterprise migration tooling",
      body: "Technology-sector implementation resources for cryptographic discovery and remediation (IBM Quantum Safe Explorer/Remediator), relevant to mainframe-based bank cores.",
      src: "IBM", url: "https://www.ibm.com/quantum/quantum-safe" },
  ],

  /* ---- Financial sector news — each linked to its source ------------------- */
  sector: [
    { d: "2025-12", tag: "Payments", title: "BIS Project Leap: PQC tested in an operational payment system",
      body: "The BIS Innovation Hub, Swift, and several central banks replaced classical digital signatures with post-quantum signatures for liquidity transfers — evidence quantum-safe tech is being tested in live, regulated payment infrastructure.",
      src: "Bank for International Settlements", url: "https://www.bis.org/about/bisih/topics/cyber_security/leap.htm" },
    { d: "2025-09", tag: "Markets", title: "DTCC: preparing market infrastructure for the quantum era",
      body: "The U.S. post-trade utility continues to publish on coordinated post-quantum migration across market utilities and runs an internal crypto-agility program.",
      src: "DTCC", url: "https://www.dtcc.com/news" },
    { d: "2026-01", tag: "Sector body", title: "FSSCC: post-quantum readiness as sector-wide resilience",
      body: "The Financial Services Sector Coordinating Council coordinates cross-firm and public-private work on cryptographic resilience, positioning PQC migration as an operational-resilience priority for the sector.",
      src: "FSSCC", url: "https://fsscc.org" },
  ],

  /* ---- Third-party / technology supplier news — each linked to its source -- */
  vendors: [
    { d: "2025", tag: "Cloud", title: "AWS: post-quantum cryptography across core services",
      body: "Hybrid ML-KEM key exchange is enabled across KMS, ACM, CloudFront, ALB, and the s2n TLS library; AWS publishes its migration plan covering signatures next.",
      src: "Amazon Web Services", url: "https://aws.amazon.com/security/post-quantum-cryptography/" },
    { d: "2025", tag: "Cloud", title: "Google Cloud: post-quantum cryptography resources",
      body: "Chrome negotiates hybrid ML-KEM by default and Google has committed to complete its own PQC migration by 2029; its cloud guidance helps customers adopt quantum-safe TLS.",
      src: "Google Cloud", url: "https://cloud.google.com/security/resources/post-quantum-cryptography" },
    { d: "2024", tag: "Edge / CDN", title: "Cloudflare: post-quantum cryptography on by default",
      body: "The longest-running production PQC deployment on the internet — hybrid key exchange on by default, with public adoption telemetry and a 2029 full-migration commitment.",
      src: "Cloudflare", url: "https://blog.cloudflare.com/pq-2024/" },
    { d: "2025", tag: "Core / mainframe", title: "IBM Quantum Safe: protecting bank cores on Z",
      body: "IBM co-authored the lattice algorithms NIST standardized and markets z16/z17 mainframes as quantum-safe; its Quantum Safe tooling does cryptographic discovery for large institutions.",
      src: "IBM", url: "https://www.ibm.com/quantum/quantum-safe" },
    { d: "2026-06", tag: "HSM / PKI", title: "Thales: quantum-safe blueprint for financial enterprises",
      body: "Luna and payShield HSMs — under most U.S. bank key ceremonies and card issuance — ship FIPS 203/204/205 support, with crypto-agility guidance for banks.",
      src: "Thales", url: "https://cpl.thalesgroup.com/encryption/post-quantum-crypto-agility" },
    { d: "2025", tag: "HSM / PKI", title: "DigiCert: post-quantum certificates and Trust Lifecycle Manager",
      body: "DigiCert issues ML-DSA test certificates and ships PQC in Trust Lifecycle Manager; CA/B Forum's shrinking certificate lifetimes force the automation banks need for PQC anyway.",
      src: "DigiCert", url: "https://digicert.com/tls-ssl/post-quantum-cryptography" },
  ],
};
