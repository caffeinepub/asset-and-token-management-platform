import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileBox, ListTodo, FolderKanban, Coins, Files } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Project } from '@/backend';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: bigint) => void;
  assetCount: number;
  canMutate?: boolean;
}

export default function ProjectCard({ project, onEdit, onDelete, assetCount, canMutate = true }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{project.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileBox className="h-3 w-3" />
            {assetCount} assets
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/assets/$projectId', params: { projectId: project.id.toString() } })}
          >
            <FileBox className="h-4 w-4 mr-2" />
            Assets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/tasks/$projectId', params: { projectId: project.id.toString() } })}
          >
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/collections/$projectId', params: { projectId: project.id.toString() } })}
          >
            <FolderKanban className="h-4 w-4 mr-2" />
            Collections
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/tokens/$projectId', params: { projectId: project.id.toString() } })}
          >
            <Coins className="h-4 w-4 mr-2" />
            Tokens
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/files/$projectId', params: { projectId: project.id.toString() } })}
          >
            <Files className="h-4 w-4 mr-2" />
            Files
          </Button>
        </div>
        {canMutate && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(project.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
