import { X } from 'lucide-react';
import './SizeChart.css';

interface SizeChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeChart = ({ isOpen, onClose }: SizeChartProps) => {
  if (!isOpen) return null;

  return (
    <div className="size-chart-overlay" onClick={onClose}>
      <div className="size-chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="size-chart-header">
          <h2 className="size-chart-title">Size Chart</h2>
          <button className="size-chart-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="size-chart-content">
          <div className="size-chart-note">
            <p><strong>How to measure:</strong> Place your foot on a flat surface and measure from heel to toe. Use the measurements below to find your perfect fit.</p>
          </div>

          <div className="size-chart-table-wrapper">
            <table className="size-chart-table">
              <thead>
                <tr>
                  <th>EU</th>
                  <th>JP</th>
                  <th>UK</th>
                  <th>SIZE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>36</td>
                  <td>220</td>
                  <td>3.5</td>
                  <td>4.0</td>
                </tr>
                <tr>
                  <td>36 2/3</td>
                  <td>225</td>
                  <td>4.0</td>
                  <td>4.5</td>
                </tr>
                <tr>
                  <td>37 1/3</td>
                  <td>230</td>
                  <td>4.5</td>
                  <td>5.0</td>
                </tr>
                <tr>
                  <td>38</td>
                  <td>235</td>
                  <td>5.0</td>
                  <td>5.5</td>
                </tr>
                <tr>
                  <td>38 2/3</td>
                  <td>240</td>
                  <td>5.5</td>
                  <td>6.0</td>
                </tr>
                <tr>
                  <td>39 1/3</td>
                  <td>245</td>
                  <td>6.0</td>
                  <td>6.5</td>
                </tr>
                <tr>
                  <td>40</td>
                  <td>250</td>
                  <td>6.5</td>
                  <td>7.0</td>
                </tr>
                <tr>
                  <td>40 2/3</td>
                  <td>255</td>
                  <td>7.0</td>
                  <td>7.5</td>
                </tr>
                <tr>
                  <td>41 1/3</td>
                  <td>260</td>
                  <td>7.5</td>
                  <td>8.0</td>
                </tr>
                <tr>
                  <td>42</td>
                  <td>265</td>
                  <td>8.0</td>
                  <td>8.5</td>
                </tr>
                <tr>
                  <td>42 2/3</td>
                  <td>270</td>
                  <td>8.5</td>
                  <td>9.0</td>
                </tr>
                <tr>
                  <td>43 1/3</td>
                  <td>275</td>
                  <td>9.0</td>
                  <td>9.5</td>
                </tr>
                <tr>
                  <td>44</td>
                  <td>280</td>
                  <td>9.5</td>
                  <td>10.0</td>
                </tr>
                <tr>
                  <td>44 2/3</td>
                  <td>285</td>
                  <td>10.0</td>
                  <td>10.5</td>
                </tr>
                <tr>
                  <td>45 1/3</td>
                  <td>290</td>
                  <td>10.5</td>
                  <td>11.0</td>
                </tr>
                <tr>
                  <td>46</td>
                  <td>295</td>
                  <td>11.0</td>
                  <td>11.5</td>
                </tr>
                <tr>
                  <td>46 2/3</td>
                  <td>300</td>
                  <td>11.5</td>
                  <td>12.0</td>
                </tr>
                <tr>
                  <td>47 1/3</td>
                  <td>305</td>
                  <td>12.0</td>
                  <td>12.5</td>
                </tr>
                <tr>
                  <td>48</td>
                  <td>310</td>
                  <td>12.5</td>
                  <td>13.0</td>
                </tr>
                <tr>
                  <td>48 2/3</td>
                  <td>315</td>
                  <td>13.0</td>
                  <td>13.5</td>
                </tr>
                <tr>
                  <td>49 1/3</td>
                  <td>320</td>
                  <td>13.5</td>
                  <td>14.0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
