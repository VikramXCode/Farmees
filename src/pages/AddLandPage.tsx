import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer, Section } from '../components/layout/AppShell';
import AddLandForm from '../components/home/AddLandForm';

export default function AddLandPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = (landId?: string) => {
    // Check if there's a returnTo parameter
    const params = new URLSearchParams(location.search);
    const returnTo = params.get('returnTo');
    
    if (returnTo && landId) {
      // Return to the specified page with the new land ID
      navigate(`/${returnTo}?landId=${landId}`);
    } else if (returnTo) {
      // Return without land ID
      navigate(`/${returnTo}`);
    } else {
      // Default behavior - go home
      navigate('/');
    }
  };

  return (
    <PageContainer>
      <Section>
        <AddLandForm onClose={handleClose} />
      </Section>
    </PageContainer>
  );
}
