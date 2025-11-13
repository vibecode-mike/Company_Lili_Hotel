import CreateAutoReplyInteractive from './CreateAutoReplyInteractive';

interface CreateAutoReplyProps {
  onBack: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToMembers?: () => void;
}

export default function CreateAutoReply(props: CreateAutoReplyProps) {
  return <CreateAutoReplyInteractive {...props} />;
}
