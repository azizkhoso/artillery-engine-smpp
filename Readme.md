# Artillery SMPP Engine

Artillery SMPP Engine is an open-source, high-performance SMPP (Short Message Peer-to-Peer) protocol engine designed for scalable SMS messaging applications. Built for reliability and extensibility, it enables developers to integrate, test, and operate SMPP-based messaging systems with ease.

## Features

- SMPP v3.4 protocol support
- High throughput message handling
- Configurable connection and session management
- Pluggable architecture for custom logic
- Detailed logging and metrics
- Easy integration with existing systems

## Getting Started

### Prerequisites

- Node.js (version 20.0.0 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/azizkhoso/artillery-engine-smpp.git
cd artillery-engine-smpp
npm install
```

### Usage
To use the SMPP engine with Artillery, create a test script (e.g., `sample.yaml`) like the following:

```yaml
config:
  target: localhost
  phases:
    - duration: 3
      arrivalRate: 20
      name: Warm up

  engines:
    smpp: {}

  smpp:
    port: 2775
    system_id: "1_1"
    password: "user@email.com"

scenarios:
  - name: SMPP Bind and Enquire
    engine: smpp
    flow:
      - bindTransceiver: true
      - think: 0.1
      - enquireLink: true
      - think: 0.1
```

Run your test with:

```bash
npx artillery run sample.yaml
```

For more configuration options and advanced scenarios, refer to the [Artillery documentation](https://www.artillery.io/docs/).

## Contributing

We welcome contributions from the community! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License.

## Community & Support

- [Issues](https://github.com/your-org/artillery-engine-smpp/issues)
- [Discussions](https://github.com/your-org/artillery-engine-smpp/discussions)

---

*Empowering open-source SMS messaging solutions.*