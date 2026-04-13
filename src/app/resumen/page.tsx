import AppGate from '@/components/AppGate';
import Shell from '@/components/Shell';
import SummaryScreen from '@/components/SummaryScreen';

export default function Page() {
  return (
    <AppGate>
      <Shell>
        <SummaryScreen />
      </Shell>
    </AppGate>
  );
}
