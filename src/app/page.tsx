import AppGate from '@/components/AppGate';
import Shell from '@/components/Shell';
import HomeScreen from '@/components/HomeScreen';

export default function Page() {
  return (
    <AppGate>
      <Shell>
        <HomeScreen />
      </Shell>
    </AppGate>
  );
}
