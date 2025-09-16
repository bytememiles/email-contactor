import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '36px', // 20% of 180px for iOS rounded corners
        }}
      >
        <div
          style={{
            background: '#ffffff',
            width: '120px',
            height: '80px',
            borderRadius: '8px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              background: '#2563eb',
              width: '110px',
              height: '70px',
              borderRadius: '6px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {/* Email content lines */}
            <div
              style={{
                background: '#ffffff',
                width: '80px',
                height: '4px',
                borderRadius: '2px',
                opacity: 0.9,
              }}
            />
            <div
              style={{
                background: '#ffffff',
                width: '60px',
                height: '4px',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                background: '#ffffff',
                width: '70px',
                height: '4px',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            />

            {/* Email envelope fold line */}
            <div
              style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                right: '5px',
                height: '2px',
                background: '#ffffff',
                clipPath: 'polygon(0 0, 50% 80%, 100% 0)',
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
