export default function Home() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh' 
    }}>
      <a
        href={`https://github.com/login/oauth/authorize?client_id=${clientId}`}
        style={{
          padding: '12px 24px',
          backgroundColor: '#24292e',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px'
        }}
      >
        Login with GitHub
      </a>
    </div>
  );
}
  