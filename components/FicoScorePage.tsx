import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FICO_HISTORY, FICO_INGREDIENTS, PlusIcon, MinusIcon } from '../constants';
import PageHeader from './PageHeader';

const getFicoRating = (score: number) => {
    if (score >= 800) return { rating: 'EXCEPTIONAL', color: '#166534' };
    if (score >= 740) return { rating: 'VERY GOOD', color: '#15803d' };
    if (score >= 670) return { rating: 'GOOD', color: '#65a30d' };
    if (score >= 580) return { rating: 'FAIR', color: '#facc15' };
    return { rating: 'POOR', color: '#dc2626' };
};

const DetailedFicoGauge: React.FC<{ score: number }> = ({ score }) => {
    const minScore = 300;
    const maxScore = 850;
    const scoreRange = maxScore - minScore;
    const angleRange = 180;
    const scoreToAngle = (s: number) => ((s - minScore) / scoreRange) * angleRange;
    const angle = scoreToAngle(score);
    const { rating } = getFicoRating(score);

    const ticks = Array.from({ length: (maxScore-minScore)/50 + 1 }, (_, i) => minScore + i * 50);

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    return (
        <div className="relative w-full aspect-[2/1] max-w-xs mx-auto">
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <defs>
                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#dc2626" />
                         <stop offset="40%" stopColor="#facc15" />
                         <stop offset="70%" stopColor="#84cc16" />
                         <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                </defs>
                
                {/* Gauge Ticks */}
                {ticks.map(tickScore => {
                    const tickAngle = scoreToAngle(tickScore);
                    const start = polarToCartesian(100, 100, 80, tickAngle);
                    const end = polarToCartesian(100, 100, 88, tickAngle);
                    return <line key={tickScore} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#d1d5db" strokeWidth="1" />
                })}

                {/* Gauge Background Arc */}
                <path d="M 10 100 A 90 90 0 0 1 190 100" stroke="#e5e7eb" strokeWidth="14" fill="none" strokeLinecap="round"/>
                
                {/* Gauge Foreground Arc */}
                <path d={`M 10 100 A 90 90 0 0 1 ${polarToCartesian(100, 100, 90, angle).x} ${polarToCartesian(100, 100, 90, angle).y}`} stroke="url(#gauge-gradient)" strokeWidth="14" fill="none" strokeLinecap="round" style={{ transition: 'all 0.5s ease' }}/>
                
                 {/* Score labels */}
                <text x="10" y="90" textAnchor="middle" fontSize="10" fill="#6b7280">300</text>
                <text x="190" y="90" textAnchor="middle" fontSize="10" fill="#6b7280">850</text>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center -mt-4">
                <div className='flex items-center text-gray-500'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    <span className="text-lg font-semibold ml-1">20</span>
                </div>
                <span className="text-7xl font-light text-gray-800 leading-tight">{score}</span>
                <span className="text-lg font-semibold text-gray-700">{rating}</span>
                 <p className="text-xs text-gray-400 mt-1">Updated 08/14/2022 | FICO® Score 9 | Experian® data</p>
            </div>
        </div>
    );
}

const HistoryGraph: React.FC = () => {
    // Basic dimensions and padding
    const width = 300;
    const height = 120;
    const padding = 20;

    const scores = FICO_HISTORY.map(d => d.score);
    const minScore = Math.min(...scores) - 20;
    const maxScore = Math.max(...scores) + 20;

    // Create point coordinates
    const points = FICO_HISTORY.map((data, i) => {
        const x = (i / (FICO_HISTORY.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((data.score - minScore) / (maxScore - minScore)) * (height - 2 * padding) - padding;
        return { ...data, x, y };
    });

    const linePath = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="bg-gray-50 rounded-lg p-4 my-4">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                <polyline
                    fill="none"
                    stroke="#a5b4fc"
                    strokeWidth="2"
                    points={linePath}
                />
                {points.map(p => (
                    <g key={p.month}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                        <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">{p.score}</text>
                        <text x={p.x} y={p.y + 20} textAnchor="middle" fontSize="12" fill="#6b7280">{p.month}</text>
                        {p.year && <text x={p.x} y={height - 5} textAnchor="middle" fontSize="12" fill="#6b7280">{p.year}</text>}
                    </g>
                ))}
            </svg>
        </div>
    )
}

const ScoreIngredient: React.FC<{ item: typeof FICO_INGREDIENTS[0], isOpen: boolean, onClick: () => void }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b">
            <button onClick={onClick} className="w-full flex justify-between items-center py-4">
                <span className="font-semibold text-gray-700">{item.title}</span>
                <div className="flex items-center">
                    <span className={`font-semibold mr-4 ${item.color}`}>{item.rating}</span>
                    {isOpen ? <MinusIcon /> : <PlusIcon />}
                </div>
            </button>
            {isOpen && (
                <div className="pb-4 pr-10 text-gray-600">
                    {item.details}
                </div>
            )}
        </div>
    );
};

const FicoScorePage: React.FC = () => {
    const [openIngredient, setOpenIngredient] = useState<string | null>(null);

    const handleToggle = (title: string) => {
        setOpenIngredient(openIngredient === title ? null : title);
    };

    return (
        <div className="bg-white min-h-full">
            <PageHeader title="FICO® Score" />
            <div className="p-4">
                <p className="text-sm text-yellow-600 font-semibold text-center mb-4">Credit Close-Up℠</p>
                
                <DetailedFicoGauge score={820} />
                <HistoryGraph />

                <div className="mt-8">
                    <h2 className="text-xl font-bold">Score ingredients</h2>
                    <p className="text-gray-500 mb-2">Explore what makes up your credit score.</p>
                    {FICO_INGREDIENTS.map(item => (
                        <ScoreIngredient 
                            key={item.title}
                            item={item}
                            isOpen={openIngredient === item.title}
                            onClick={() => handleToggle(item.title)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FicoScorePage;