import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#2563eb',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            width: '20px',
            height: '14px',
            borderRadius: '2px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#2563eb',
              width: '18px',
              height: '12px',
              borderRadius: '1px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                width: '14px',
                height: '1px',
                opacity: 0.9,
              }}
            />
            <div
              style={{
                background: '#ffffff',
                width: '10px',
                height: '1px',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                background: '#ffffff',
                width: '12px',
                height: '1px',
                opacity: 0.7,
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
