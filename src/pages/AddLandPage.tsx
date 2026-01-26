import { useNavigate } from 'react-router-dom';
import { PageContainer, Section } from '../components/layout/AppShell';
import AddLandForm from '../components/home/AddLandForm';

export default function AddLandPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <PageContainer>
      <Section>
        <AddLandForm onClose={handleClose} />
      </Section>
    </PageContainer>
  );
}
