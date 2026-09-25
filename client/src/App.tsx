import { Navigate, Route, Routes } from "react-router";
import Auth from "./pages/Auth";
import AppLayout from "./components/dashboard/AppLayout";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import GroupDetails from "./pages/GroupDetails";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";
import Placeholder from "./pages/Placeholder";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />

      {/* Signed-in routes share one shell: sidebar + navbar + page content. */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetails />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Placeholder title="Profile" />} />
      </Route>

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default App;
