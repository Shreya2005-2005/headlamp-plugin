import { apply } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useHLSelectedClusters } from '../index';

/**
 * SecurityExceptionCreate — guided form to create a new SecurityException.
 * Supports creating from a failing control or CVE on a workload.
 * Pre-fills controlID and namespace when accessed from compliance view.
 */
export function SecurityExceptionCreate() {
  const history = useHistory();
  const clusters = useHLSelectedClusters();
  const cluster = clusters?.[0] ?? '';

  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [reason, setReason] = useState('accepted-risk');
  const [controlID, setControlID] = useState('');
  const [action, setAction] = useState('ignore');
  const [expiresAt, setExpiresAt] = useState('');
  const [author, setAuthor] = useState('');
  const [kind, setKind] = useState('Deployment');
  const [resourceName, setResourceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !controlID) {
      setError('Name and Control ID are required.');
      return;
    }

    const manifest: any = {
      apiVersion: 'kubescape.io/v1beta1',
      kind: 'SecurityException',
      metadata: {
        name,
        namespace,
        annotations: {
          'managed-by': 'headlamp',
          'created-by': author || 'headlamp-user',
        },
      },
      spec: {
        author: author || 'headlamp-user',
        reason,
        posture: [{ controlID, action }],
        match: {
          resources: kind ? [{ apiGroup: 'apps', kind, name: resourceName || undefined }] : [],
        },
      },
    };

    if (expiresAt) {
      manifest.spec.expiresAt = new Date(expiresAt).toISOString();
    }

    setLoading(true);
    try {
      await apply(manifest, { cluster });
      history.push('/kubescape/security-exceptions');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create SecurityException');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionBox title="Create Security Exception">
      <Stack spacing={3} maxWidth={600}>
        <Typography variant="body2" color="text.secondary">
          Create a GitOps-native SecurityException to declare a posture exception
          directly in-cluster. The exception will be version-controlled and
          automatically picked up by the kubescape scanner.
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <TextField
          label="Exception Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          helperText="e.g. skip-privileged-nginx"
        />

        <TextField
          label="Namespace"
          value={namespace}
          onChange={e => setNamespace(e.target.value)}
          required
        />

        <TextField
          label="Control ID"
          value={controlID}
          onChange={e => setControlID(e.target.value)}
          required
          helperText="e.g. C-0016"
          inputProps={{ pattern: 'C-[0-9]{4}' }}
        />

        <FormControl fullWidth>
          <InputLabel>Action</InputLabel>
          <Select value={action} label="Action" onChange={e => setAction(e.target.value)}>
            <MenuItem value="ignore">ignore — skip this control entirely</MenuItem>
            <MenuItem value="alert_only">alert_only — keep finding, downgrade severity</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Reason</InputLabel>
          <Select value={reason} label="Reason" onChange={e => setReason(e.target.value)}>
            <MenuItem value="accepted-risk">Accepted Risk</MenuItem>
            <MenuItem value="false-positive">False Positive</MenuItem>
            <MenuItem value="compensating-control">Compensating Control</MenuItem>
            <MenuItem value="will-not-fix">Will Not Fix</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Author"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          helperText="Team or person creating this exception"
        />

        <FormControl fullWidth>
          <InputLabel>Resource Kind</InputLabel>
          <Select value={kind} label="Resource Kind" onChange={e => setKind(e.target.value)}>
            <MenuItem value="Deployment">Deployment</MenuItem>
            <MenuItem value="DaemonSet">DaemonSet</MenuItem>
            <MenuItem value="StatefulSet">StatefulSet</MenuItem>
            <MenuItem value="Pod">Pod</MenuItem>
            <MenuItem value="">All (no filter)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Resource Name (optional)"
          value={resourceName}
          onChange={e => setResourceName(e.target.value)}
          helperText="Leave empty to match all resources of the selected kind"
        />

        <TextField
          label="Expires At (optional)"
          type="date"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="Leave empty for no expiry"
        />

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create SecurityException'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => history.push('/kubescape/security-exceptions')}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </SectionBox>
  );
}
