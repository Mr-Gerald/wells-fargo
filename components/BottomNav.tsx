import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, DepositIcon, MenuIcon, TransferIcon, ExploreIcon } from '../constants';

const NavItem: React.FC<{ to: string, active: boolean, Icon: React.FC<{ active?: boolean }>, label: string }> = ({ to, active, Icon, label }) => {
    const activeClass = active ? 'text-wells-red' : 'text-gray-600';
    return (
        <Link to={to} className="flex flex-col items-center justify-center w-1/5 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wells-red rounded-md">
            <Icon active={active} />
            <span className={`text-xs mt-1 font-medium ${activeClass}`}>{label}</span>
        </Link>
    );
}

const BottomNav: React.FC = () => {
    const location = useLocation();
    const { pathname } = location;

    const isAccountsActive = pathname.startsWith('/account') || pathname === '/';

    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 shadow-t-lg">
            <div className="flex justify-around items-center h-16">
                <NavItem 
                    to="/" 
                    active={isAccountsActive} 
                    Icon={HomeIcon} 
                    label="Accounts" 
                />
                <NavItem 
                    to="/deposit" 
                    active={pathname.startsWith('/deposit')} 
                    Icon={DepositIcon} 
                    label="Deposit" 
                />
                <NavItem 
                    to="/pay-transfer" 
                    active={pathname.startsWith('/pay-transfer')} 
                    Icon={TransferIcon} 
                    label="Pay & Transfer" 
                />
                <NavItem 
                    to="/explore" 
                    active={pathname.startsWith('/explore')} 
                    Icon={ExploreIcon} 
                    label="Explore" 
                />
                <NavItem 
                    to="/menu" 
                    active={pathname.startsWith('/menu')} 
                    Icon={MenuIcon} 
                    label="Menu" 
                />
            </div>
        </footer>
    );
};

export default BottomNav;