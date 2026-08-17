const { loadConfig } = require('../services/api/src/config');
const { createProviderClient } = require('../services/api/src/provider-client');

async function main() {
  const config = loadConfig();
  const client = createProviderClient(config.provider);
  const result = await client.generateStructured({
    instructions: 'Return a JSON object that follows the schema exactly.',
    input: 'Set ok to true and label to the configured model name.',
    schemaName: 'provider_connection_check',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ok: { type: 'boolean' },
        label: { type: 'string' }
      },
      required: ['ok', 'label']
    }
  });

  console.log(JSON.stringify({
    ok: result.data.ok === true,
    model: result.meta.model,
    protocol: result.meta.protocol,
    usage: result.meta.usage
  }, null, 2));
}

main().catch((error) => {
  console.error(`${error.code || 'PROVIDER_CHECK_FAILED'}: ${error.message}`);
  process.exit(1);
});
