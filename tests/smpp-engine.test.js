'use strict';

const EventEmitter = require('events');
const SmppEngine = require('..'); // Adjust path if needed

// Mock script configuration
const script = {
  config: {
    target: 'localhost',
    smpp: {
      port: 2775,
      system_id: 'testuser',
      password: 'testpass',
    },
  },
  scenarios: [
    {
      name: 'bind and enquire scenario',
      engine: 'smpp',
      flow: [
        { bindTransceiver: true },
        { enquireLink: true },
      ],
    },
  ],
};

describe('SMPP Engine', () => {
  it('should instantiate with valid script', () => {
    const ee = new EventEmitter();
    const helpers = {};
    const engine = new SmppEngine(script, ee, helpers);

    expect(engine.script).toEqual(script);
    expect(typeof engine.createScenario).toBe('function');
  });

  it('createScenario should return a scenario function', () => {
    const ee = new EventEmitter();
    const engine = new SmppEngine(script, ee, {});
    const scenarioFn = engine.createScenario(script.scenarios[0], ee);

    expect(typeof scenarioFn).toBe('function');
  });

  it('should emit "started" event when scenario runs', (done) => {
    const ee = new EventEmitter();
    const engine = new SmppEngine(script, ee, {});
    // const scenarioFn = engine.createScenario(script.scenarios[0], ee);

    const events = [];
    ee.on('started', () => {
      events.push('started');
    });

    // mock smpp.Session to avoid real connections
    const mockSession = {
      bind_transceiver: jest.fn((_, cb) => cb({ command_status: 0 })),
      enquire_link: jest.fn((cb) => cb({ command_status: 0 })),
      close: jest.fn(),
      once: jest.fn((event, cb) => {
        if (event === 'connect') setImmediate(cb);
      }),
      on: jest.fn(),
    };

    // Patch the engine to inject our mock session instead of real smpp.Session
    engine.createScenario = function (scenarioSpec, ee) {
      const tasks = scenarioSpec.flow.map((rs) => this.step(rs, ee));

      return function scenario(initialContext, callback) {
        const context = {
          session: mockSession,
          connected: true,
          bound: false,
        };

        ee.emit('started');

        require('async').waterfall(
          [
            function (cb) {
              cb(null, context);
            },
            ...tasks,
            function (_, cb) {
              mockSession.close();
              cb(null, {});
            },
          ],
          function don(err) {
            if (err) {
              console.log(err);
              return;
            };
            expect(events.includes('started')).toBe(true);
            expect(mockSession.bind_transceiver).toHaveBeenCalled();
            expect(mockSession.enquire_link).toHaveBeenCalled();
            done();
          }
        );
      };
    };

    const patchedScenario = engine.createScenario(script.scenarios[0], ee);
    patchedScenario({}, () => {});
  });
});
