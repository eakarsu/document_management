const WebSocket = require('ws');

function testWebSocketConnection() {
  console.log('🔌 Testing WebSocket GraphQL subscription endpoint...');
  
  const ws = new WebSocket('ws://localhost:4000/graphql');
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connection established');
    
    // Send connection init message for GraphQL subscriptions
    ws.send(JSON.stringify({ type: 'connection_init' }));
    
    setTimeout(() => {
      console.log('✅ WebSocket test completed - connection is working');
      ws.close();
    }, 2000);
  });

  ws.on('message', function message(data) {
    const msg = JSON.parse(data.toString());
    console.log('📨 Received message:', msg.type);
    if (msg.type === 'connection_ack') {
      console.log('✅ WebSocket GraphQL protocol handshake successful');
    }
  });

  ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
  });

  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
  });
}

testWebSocketConnection();