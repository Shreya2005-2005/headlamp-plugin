import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useK8sObject } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/hooks';
import { Chip, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useHLSelectedClusters } from '../index';

export function SecurityExceptionDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const clusters = useHLSelectedClusters();
  const cluster = clusters?.[0] ?? '';

  const [item] = useK8sObject({
    cluster,
    group: 'kubescape.io',
    version: 'v1beta1',
    resource: 'securityexceptions',
    namespace,
    name,
  });

  if (!item) return <Typography>Loading...</Typography>;

  const spec = (item as any).spec ?? {};
  const posture = spec.posture ?? [];
  const match = spec.match ?? {};

  return (
    <>
      <SectionBox title="Security Exception Details">
        <DetailsGrid
          resource={item}
          extraInfo={[
            { name: 'Reason', value: spec.reason ?? '—' },
            { name: 'Author', value: spec.author ?? '—' },
            { name: 'Expires At', value: spec.expiresAt ?? 'Never' },
          ]}
        />
      </SectionBox>

      <SectionBox title="Posture Controls">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {posture.length === 0
            ? <Typography variant="body2">No posture controls defined.</Typography>
            : posture.map((p: any) => (
              <Chip
                key={p.controlID}
                label={`${p.controlID} — ${p.action}`}
                color={p.action === 'ignore' ? 'warning' : 'info'}
              />
            ))}
        </Stack>
      </SectionBox>

      <SectionBox title="Match Selectors">
        {match.resources && (
          <>
            <Typography variant="subtitle2">Resources</Typography>
            {match.resources.map((r: any, i: number) => (
              <Typography key={i} variant="body2">
                {r.apiGroup}/{r.kind}: {r.name ?? '*'}
              </Typography>
            ))}
          </>
        )}
        {match.objectSelector?.matchLabels && (
          <>
            <Typography variant="subtitle2" mt={1}>Object Selector</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {Object.entries(match.objectSelector.matchLabels).map(([k, v]) => (
                <Chip key={k} label={`${k}=${v}`} size="small" />
              ))}
            </Stack>
          </>
        )}
        {match.namespaceSelector?.matchLabels && (
          <>
            <Typography variant="subtitle2" mt={1}>Namespace Selector</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {Object.entries(match.namespaceSelector.matchLabels).map(([k, v]) => (
                <Chip key={k} label={`${k}=${v}`} size="small" />
              ))}
            </Stack>
          </>
        )}
      </SectionBox>
    </>
  );
}
