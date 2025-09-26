import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Group, Star, Warning, MoreVert } from '@mui/icons-material';
import { TeamMemberPerformance, TeamPerformanceInsights } from '@/types/team-performance';
import { usePerformanceUtils } from '../../../hooks/team-performance/usePerformanceUtils';

interface TeamMembersTableProps {
  insights: TeamPerformanceInsights;
  filteredMembers: TeamMemberPerformance[];
  filterDepartment: string;
  onFilterDepartmentChange: (department: string) => void;
  onMemberMenuClick: (event: React.MouseEvent<HTMLElement>, memberId: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  insights,
  filteredMembers,
  filterDepartment,
  onFilterDepartmentChange,
  onMemberMenuClick
}) => {
  const { getPerformanceColor, getTrendIcon, getTrendColor, getWorkloadColor } = usePerformanceUtils();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Group sx={{ mr: 1 }} />
            Team Members ({filteredMembers.length})
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={filterDepartment}
              label="Department"
              onChange={(e) => onFilterDepartmentChange(e.target.value)}
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="Legal">Legal</MenuItem>
              <MenuItem value="Compliance">Compliance</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Trend</TableCell>
                <TableCell>Workload</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => {
                const TrendIcon = getTrendIcon(member.trends.performanceTrend);
                const trendColor = getTrendColor(member.trends.performanceTrend);

                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: getPerformanceColor(member.performance.overallScore) + '.main' }}>
                          {member.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{member.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.role} • {member.department}
                          </Typography>
                        </Box>
                        {insights.topPerformers.includes(member.userId) && (
                          <Star color="primary" sx={{ ml: 1 }} />
                        )}
                        {insights.riskyMembers.includes(member.userId) && (
                          <Warning color="error" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {member.performance.overallScore}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={member.performance.overallScore}
                          color={getPerformanceColor(member.performance.overallScore) as any}
                          sx={{ width: 60, height: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendIcon color={trendColor} />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {member.trends.productivityChange > 0 ? '+' : ''}{member.trends.productivityChange}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${member.metrics.workloadCapacity}%`}
                        size="small"
                        color={getWorkloadColor(member.metrics.workloadCapacity)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => onMemberMenuClick(e, member.userId)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TeamMembersTable;