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

export function SecurityExceptionEvents({ name, namespace }: { name: string; namespace: string }) {
  const clusters = useHLSelectedClusters();
  const cluster = clusters?.[0] ?? '';

  const [events] = useK8sObjectList({
    cluster,
    group: '',
    version: 'v1',
    resource: 'events',
    namespace,
    queryParams: {
      fieldSelector: `involvedObject.name=${name},involvedObject.namespace=${namespace}`,
    },
  });

  const matchEvents = (events ?? []).filter(
    (e: any) => e.reason === 'ExceptionMatched' || e.reason === 'SecurityExceptionChanged'
  );

  return (
    <SectionBox title="Exception Events">
      {matchEvents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No events yet. Events appear here when this exception is matched during a kubescape scan
          or when the resource changes and triggers a rescan.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {matchEvents.map((e: any, i: number) => (
            <Stack key={i} direction="row" spacing={2} alignItems="center">
              <Chip
                label={e.reason}
                size="small"
                color={e.reason === 'ExceptionMatched' ? 'success' : 'info'}
              />
              <Typography variant="body2">{e.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(e.lastTimestamp).toLocaleString()}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </SectionBox>
  );
}
