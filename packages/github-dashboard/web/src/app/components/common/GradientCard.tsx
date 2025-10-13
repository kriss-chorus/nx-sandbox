import styled from '@emotion/styled';
import { Paper, PaperProps } from '@mui/material';

export interface GradientCardProps extends PaperProps {
  isPremium?: boolean;
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isPremium',
})<{ isPremium?: boolean }>`
  border-radius: 12px;
  transition: all 0.3s ease-in-out;
  border: 2px solid transparent;
  background: ${({ isPremium }) =>
    isPremium
      ? 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
      : 'white'};
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    border-color: ${({ isPremium }) => (isPremium ? '#667eea' : '#e0e0e0')};
  }
`;

export const GradientCard = ({ isPremium, children, ...props }: GradientCardProps) => {
  return (
    <StyledCard isPremium={isPremium} {...props}>
      {children}
    </StyledCard>
  );
};
