import AppGate from '@/components/AppGate';
import Shell from '@/components/Shell';
import ConfigScreen from '@/components/ConfigScreen';

export default function Page() {
  return (
    <AppGate>
      <Shell>
        <ConfigScreen />
      </Shell>
    </AppGate>
  );
}
