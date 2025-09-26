'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Stack, Chip, Button, useTheme, alpha } from '@mui/material';
import { CheckCircle, ArrowForward, PlayCircle } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export const AnimatedHeroSection: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const [text1Index, setText1Index] = useState(0);
  const [text2Index, setText2Index] = useState(0);
  const [startText2, setStartText2] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const text1 = 'Mission Sync AI';
  const text2 = 'Automated Workflow Solutions';

  useEffect(() => {
    setIsVisible(true);

    // Type first text
    const timer1 = setInterval(() => {
      setText1Index(prev => {
        if (prev >= text1.length) {
          clearInterval(timer1);
          // Start second text after first is complete
          setTimeout(() => setStartText2(true), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(timer1);
  }, []);

  useEffect(() => {
    if (!startText2) return;

    // Type second text
    const timer2 = setInterval(() => {
      setText2Index(prev => {
        if (prev >= text2.length) {
          clearInterval(timer2);
          return prev;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(timer2);
  }, [startText2]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        pt: 8,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay for better text visibility */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)',
          zIndex: 1
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box>
          {/* Animated Badge */}
          <Box
            sx={{
              display: 'inline-block',
              mb: 3,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out'
            }}
          >
            <Chip
              icon={<CheckCircle />}
              label="Trusted by 500+ Military Organizations"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 2.5,
                px: 1,
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
              }}
            />
          </Box>

          {/* Main Title with Typing Effect - VISIBLE NOW */}
          <Box sx={{ minHeight: '200px', mb: 3 }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                lineHeight: 1.1,
                color: 'white',
                textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
              }}
            >
              <Box component="span" sx={{ display: 'block' }}>
                {text1.substring(0, text1Index)}
                {text1Index < text1.length && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: '4px',
                      height: '1em',
                      background: 'white',
                      marginLeft: '2px',
                      animation: 'blink 1s infinite',
                      '@keyframes blink': {
                        '0%, 50%': { opacity: 1 },
                        '51%, 100%': { opacity: 0 }
                      }
                    }}
                  />
                )}
              </Box>
              <Box component="span" sx={{ display: 'block', color: '#99ddff', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                {text2.substring(0, text2Index)}
                {startText2 && text2Index < text2.length && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: '4px',
                      height: '1em',
                      background: '#99ddff',
                      marginLeft: '2px',
                      animation: 'blink 1s infinite',
                      '@keyframes blink': {
                        '0%, 50%': { opacity: 1 },
                        '51%, 100%': { opacity: 0 }
                      }
                    }}
                  />
                )}
              </Box>
            </Typography>
          </Box>

          {/* Animated Subtitle */}
          <Box
            sx={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out',
              transitionDelay: '2.5s'
            }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                color: 'rgba(255, 255, 255, 0.95)',
                textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                fontWeight: 400,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                lineHeight: 1.6
              }}
            >
              Streamline your processes with our AI-driven, policy-aligned content authoring and workflow automation systems
            </Typography>
          </Box>

          {/* Animated Description */}
          <Box
            sx={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out',
              transitionDelay: '2.7s'
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                fontWeight: 300,
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.8,
                maxWidth: '800px'
              }}
            >
              Empowering businesses workflow, content management and authoring processes into a single stream governance solution
            </Typography>
          </Box>

          {/* Animated Features */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mb: 4,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 1s ease-out',
              transitionDelay: '2.9s'
            }}
          >
            {['AFI Compliant', '12-Stage Workflow', 'AI-Powered'].map((feature) => (
              <Chip
                key={feature}
                icon={<CheckCircle />}
                label={feature}
                color="primary"
                sx={{
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  }
                }}
              />
            ))}
          </Stack>

          {/* Animated CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out',
              transitionDelay: '3.1s'
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => router.push('/dashboard')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)'
                }
              }}
            >
              Start 14-Day Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PlayCircle />}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 3,
                borderWidth: 2,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  color: '#764ba2'
                }
              }}
            >
              Watch Demo
            </Button>
          </Stack>

          {/* Animated Caption */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 2,
              display: 'block',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out',
              transitionDelay: '3.3s'
            }}
          >
            ✓ No credit card required  ✓ Setup in 5 minutes  ✓ Cancel anytime
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AnimatedHeroSection;