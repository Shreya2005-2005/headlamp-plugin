import {
  Link as HeadlampLink,
  SectionBox,
  SectionFilterHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useK8sObjectList } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/hooks';
import { Chip, Tooltip, Typography } from '@mui/material';
import { useHLSelectedClusters } from '../index';

// GVR for SecurityException (namespaced)
const SecurityExceptionGVR = {
  group: 'kubescape.io',
  version: 'v1beta1',
  resource: 'securityexceptions',
};

// GVR for ClusterSecurityException (cluster-scoped)
const ClusterSecurityExceptionGVR = {
  group: 'kubescape.io',
  version: 'v1beta1',
  resource: 'clustersecurityexceptions',
};

function ExpiryChip({ expiresAt }: { expiresAt?: string }) {
  if (!expiresAt) return <Chip label="Never" size="small" color="default" />;
  const expired = new Date(expiresAt) < new Date();
  return (
    <Tooltip title={expiresAt}>
      <Chip
        label={expired ? 'Expired' : new Date(expiresAt).toLocaleDateString()}
        size="small"
        color={expired ? 'error' : 'success'}
      />
    </Tooltip>
  );
}

function ControlChips({ posture }: { posture?: any[] }) {
  if (!posture || posture.length === 0) return <Typography variant="caption">—</Typography>;
  return (
    <>
      {posture.map((p: any) => (
        <Chip
          key={p.controlID}
          label={`${p.controlID} (${p.action})`}
          size="small"
          color={p.action === 'ignore' ? 'warning' : 'info'}
          style={{ marginRight: 4, marginBottom: 2 }}
        />
      ))}
    </>
  );
}

export function SecurityExceptionList() {
  const clusters = useHLSelectedClusters();
  const cluster = clusters?.[0] ?? '';

  const [namespaced] = useK8sObjectList({
    cluster,
    ...SecurityExceptionGVR,
  });

  const [clustered] = useK8sObjectList({
    cluster,
    ...ClusterSecurityExceptionGVR,
  });

  const nsRows = (namespaced ?? []).map((item: any) => ({
    name: item.metadata?.name,
    namespace: item.metadata?.namespace,
    scope: 'Namespaced',
    reason: item.spec?.reason ?? '—',
    controls: item.spec?.posture,
    expiresAt: item.spec?.expiresAt,
    raw: item,
  }));

  const clRows = (clustered ?? []).map((item: any) => ({
    name: item.metadata?.name,
    namespace: '(cluster)',
    scope: 'Cluster',
    reason: item.spec?.reason ?? '—',
    controls: item.spec?.posture,
    expiresAt: item.spec?.expiresAt,
    raw: item,
  }));

  const allRows = [...nsRows, ...clRows];

  return (
    <SectionBox
      title={
        <SectionFilterHeader
          title="Security Exceptions"
          noNamespaceFilter={false}
        />
      }
    >
      <SimpleTable
        columns={[
          {
            label: 'Name',
            getter: (row: any) => (
              <HeadlampLink
                routeName={row.scope === 'Namespaced'
                  ? '/kubescape/security-exceptions/:namespace/:name'
                  : '/kubescape/cluster-security-exceptions/:name'}
                params={row.scope === 'Namespaced'
                  ? { namespace: row.namespace, name: row.name }
                  : { name: row.name }}
              >
                {row.name}
              </HeadlampLink>
            ),
          },
          { label: 'Namespace', getter: (row: any) => row.namespace },
          { label: 'Scope', getter: (row: any) => row.scope },
          { label: 'Reason', getter: (row: any) => row.reason },
          {
            label: 'Controls',
            getter: (row: any) => <ControlChips posture={row.controls} />,
          },
          {
            label: 'Expires',
            getter: (row: any) => <ExpiryChip expiresAt={row.expiresAt} />,
          },
        ]}
        data={allRows}
        emptyMessage="No SecurityExceptions found. Create one to declare a GitOps-native posture exception."
      />
    </SectionBox>
  );
}
