import si from 'systeminformation';

export const getSystemStats = async () => {
    const [load, mem] = await Promise.all([
        si.currentLoad(),
        si.mem(),
    ]);

    return {
        cpuLoad: Math.round(load.currentLoad),
        memoryUsage: Math.round((mem.active / mem.total) * 100),
        uptime: si.time().uptime,
    };
};
