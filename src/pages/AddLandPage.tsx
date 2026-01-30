import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer, Section } from '../components/layout/AppShell';
import AddLandForm from '../components/home/AddLandForm';

export default function AddLandPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in edit mode
  const params = new URLSearchParams(location.search);
  const editLandId = params.get('edit');

  const handleClose = (landId?: string) => {
    // Check if there's a returnTo parameter
    const returnTo = params.get('returnTo');
    
    if (returnTo && landId) {
      // Return to the specified page with the new land ID
      navigate(`/${returnTo}?landId=${landId}`);
    } else if (returnTo) {
      // Return without land ID
      navigate(`/${returnTo}`);
    } else if (editLandId) {
      // If editing, return to My Lands page
      navigate('/my-lands');
    } else {
      // Default behavior - go home
      navigate('/');
    }
  };

  return (
    <PageContainer>
      <Section>
        <AddLandForm onClose={handleClose} editLandId={editLandId || undefined} />
      </Section>
    </PageContainer>
  );
}
